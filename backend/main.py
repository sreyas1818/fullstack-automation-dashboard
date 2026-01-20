from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import get_db
import requests

from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

# ========================
# APP
# ========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================
# MODELS
# ========================
class LoginData(BaseModel):
    username: str
    password: str

class ChatRequest(BaseModel):
    message: str

# ========================
# OLLAMA
# ========================
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "mistral"

# ========================
# RAG GLOBALS
# ========================
embedder = None
documents = []
index = None

# ========================
# CONSTANTS
# ========================
INTENTS = {
    "min": ["minimum", "lowest", "min"],
    "max": ["maximum", "highest", "max", "best"],
    "avg": ["average", "mean", "avg"],
    "sum": ["total", "sum", "overall"],
    "diff": ["difference", "compare"],
    "pct": ["percentage", "percent", "%"],
    "trend": ["trend", "growth", "decline", "performance"]
}

METRICS = {
    "electronics": "electronics",
    "clothing": "clothing",
    "groceries": "groceries",
    "total": "total_sales"
}

MONTHS = {
    "jan": "Jan", "feb": "Feb", "mar": "Mar", "apr": "Apr",
    "may": "May", "jun": "Jun", "jul": "Jul", "aug": "Aug",
    "sep": "Sep", "oct": "Oct", "nov": "Nov", "dec": "Dec"
}

MONTH_ORDER = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4,
    "May": 5, "Jun": 6, "Jul": 7, "Aug": 8,
    "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
}

# ========================
# LOAD SALES DATA → TEXT
# ========================
def load_sales_documents():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM sales_data ORDER BY id")
    rows = cursor.fetchall()
    cursor.close()
    db.close()

    docs = []
    for r in rows:
        docs.append(
            f"""
Month: {r['month']}
Electronics: {r['electronics']}
Clothing: {r['clothing']}
Groceries: {r['groceries']}
Total Sales: {r['total_sales']}
""".strip()
        )
    return docs

# ========================
# INIT RAG
# ========================
@app.on_event("startup")
def init_rag():
    global embedder, documents, index
    print("⏳ Initializing RAG...")

    embedder = SentenceTransformer("all-MiniLM-L6-v2")
    documents = load_sales_documents()

    if not documents:
        print("⚠️ No data found")
        return

    embeddings = embedder.encode(documents, convert_to_numpy=True)
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)

    print("✅ RAG Ready")

# ========================
# RAG RETRIEVAL
# ========================
def retrieve_indices(question, k=12):
    if index is None:
        return []
    q_emb = embedder.encode([question], convert_to_numpy=True)
    _, ids = index.search(q_emb, k)
    return ids[0].tolist()

# ========================
# DATABASE ROWS
# ========================
def get_sales_rows():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM sales_data ORDER BY id")
    rows = cursor.fetchall()
    cursor.close()
    db.close()
    return rows

def fetch_rows_by_indices(indices):
    rows = get_sales_rows()
    return [rows[i] for i in indices if i < len(rows)]

# ========================
# HELPERS
# ========================
def detect_intent(question):
    q = question.lower()
    intents = []

    for intent, keys in INTENTS.items():
        if any(k in q for k in keys):
            intents.append(intent)

    metric = "total_sales"
    for m in METRICS:
        if m in q:
            metric = METRICS[m]

    return intents, metric

def extract_months(question):
    q = question.lower()
    return [v for k, v in MONTHS.items() if k in q]

# ========================
# NUMERIC ENGINE (FINAL)
# ========================
def compute_facts(question, rows):
    if not rows:
        return None

    intents, metric = detect_intent(question)
    months_in_q = extract_months(question)

    # Filter by months if mentioned
    if months_in_q:
        rows = [r for r in rows if r["month"] in months_in_q]

    if not rows:
        return None

    # Always sort chronologically
    rows.sort(key=lambda r: MONTH_ORDER.get(r["month"], 99))

    values = [r[metric] for r in rows]

    facts = {
        "metric": metric,
        "months": [r["month"] for r in rows],
        "values": values
    }

    # ---------- RANGE LOGIC ----------
    if len(rows) >= 2:
        first, last = rows[0], rows[-1]

        if "avg" in intents:
            facts["average"] = round(sum(values) / len(values), 2)

        if "pct" in intents:
            old, new = first[metric], last[metric]
            pct = ((new - old) / old) * 100 if old else 0

            facts["percentage_change"] = {
                "from": first["month"],
                "to": last["month"],
                "old": old,
                "new": new,
                "value": round(pct, 2),
                "trend": "increase" if pct > 0 else "decrease" if pct < 0 else "no change"
            }

    # ---------- SINGLE METRIC ----------
    if "min" in intents:
        r = min(rows, key=lambda x: x[metric])
        facts["minimum"] = {"month": r["month"], "value": r[metric]}

    if "max" in intents:
        r = max(rows, key=lambda x: x[metric])
        facts["maximum"] = {"month": r["month"], "value": r[metric]}

    if "sum" in intents:
        facts["sum"] = sum(values)

    if "diff" in intents and len(rows) == 2:
        diff = rows[1][metric] - rows[0][metric]
        facts["difference"] = abs(diff)
        facts["trend"] = "increase" if diff > 0 else "decrease" if diff < 0 else "no change"

    return facts

# ========================
# LLM FORMATTER
# ========================
def format_with_llm(facts, question):
    prompt = f"""
You are a dashboard analytics assistant.
Convert FACTS into a clear answer.
DO NOT calculate.
DO NOT change numbers.

FACTS:
{facts}

QUESTION:
{question}

ANSWER:
"""
    res = requests.post(
        OLLAMA_URL,
        json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
        timeout=60
    )
    return res.json().get("response")

# ========================
# LOGIN (UNCHANGED)
# ========================
@app.post("/login")
def login(data: LoginData):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM admins WHERE username=%s AND password=%s",
        (data.username, data.password)
    )
    user = cursor.fetchone()
    cursor.close()
    db.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {"message": "Login successful"}

# ========================
# DASHBOARD DATA (UNCHANGED)
# ========================
@app.get("/sales-data")
def sales_data():
    return get_sales_rows()

@app.get("/transactions")
def transactions():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM transactions ORDER BY created_at DESC")
    rows = cursor.fetchall()
    cursor.close()
    db.close()
    return rows

# ========================
# CHAT ENDPOINT
# ========================
@app.post("/chat")
def chat(req: ChatRequest):
    question = req.message.strip()

    indices = retrieve_indices(question)
    rows = fetch_rows_by_indices(indices)

    facts = compute_facts(question, rows)

    if facts:
        return {"reply": format_with_llm(facts, question)}

    # Fallback
    res = requests.post(
        OLLAMA_URL,
        json={"model": OLLAMA_MODEL, "prompt": question, "stream": False},
        timeout=60
    )
    return {"reply": res.json().get("response")}
