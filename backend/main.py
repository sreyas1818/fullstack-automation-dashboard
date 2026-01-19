from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import get_db
import requests

app = FastAPI()

# ------------------ CORS ------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ MODELS ------------------
class LoginData(BaseModel):
    username: str
    password: str

class ChatRequest(BaseModel):
    message: str

# ------------------ CONSTANTS ------------------
OLLAMA_URL = "http://localhost:11434/api/generate"

MONTHS = {
    "jan": "Jan", "january": "Jan",
    "feb": "Feb", "february": "Feb",
    "mar": "Mar", "march": "Mar",
    "apr": "Apr", "april": "Apr",
    "may": "May",
    "jun": "Jun", "june": "Jun",
    "jul": "Jul", "july": "Jul",
    "aug": "Aug", "august": "Aug",
    "sep": "Sep", "september": "Sep",
    "oct": "Oct", "october": "Oct",
    "nov": "Nov", "november": "Nov",
    "dec": "Dec", "december": "Dec"
}

MONTH_ORDER = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

CATEGORY_COLUMNS = {
    "electronics": "electronics",
    "clothing": "clothing",
    "groceries": "groceries",
    "total": "total_sales"
}

# ------------------ LOGIN ------------------
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

# ------------------ TRANSACTIONS ------------------
@app.get("/transactions")
def get_transactions():
    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT * FROM transactions ORDER BY created_at DESC")
    data = cursor.fetchall()

    cursor.close()
    db.close()

    return data

# ------------------ CHATBOT ------------------
@app.post("/chat")
def chat(req: ChatRequest):
    q = req.message.lower().strip()
    words = q.replace("-", " ").split()

    # ------------------ detect category ------------------
    category = None
    for c in CATEGORY_COLUMNS:
        if c in q:
            category = c
            break

    # ------------------ detect months ------------------
    found_months = []
    for w in words:
        key = w[:3]
        if key in MONTHS:
            found_months.append(MONTHS[key])
    found_months = list(dict.fromkeys(found_months))  # remove duplicates

    # ------------------ detect action ------------------
    if any(k in q for k in ["highest", "maximum", "max"]):
        action = "max"
    elif any(k in q for k in ["lowest", "minimum", "min"]):
        action = "min"
    elif any(k in q for k in ["average", "avg"]):
        action = "average"
    elif "sum" in q:
        action = "sum"
    else:
        action = "list"

    # ------------------ NON-DATA FALLBACK ------------------
    if not category:
        generic_prompt = f"""
You are an admin dashboard assistant.
Answer briefly and politely.
Do not mention sales numbers.

Question:
{req.message}
"""
        try:
            res = requests.post(
                OLLAMA_URL,
                json={"model": "phi", "prompt": generic_prompt, "stream": False},
                timeout=20
            )
            return {"reply": res.json().get("response", "How can I help you?")}
        except:
            return {"reply": "I can help with dashboard-related questions."}

    # ------------------ SQL LOGIC ------------------
    column = CATEGORY_COLUMNS[category]

    if len(found_months) == 2:
        start = MONTH_ORDER.index(found_months[0])
        end = MONTH_ORDER.index(found_months[1])
        if start > end:
            start, end = end, start
        months_to_use = MONTH_ORDER[start:end + 1]
    elif len(found_months) == 1:
        months_to_use = found_months
    else:
        months_to_use = MONTH_ORDER

    placeholders = ",".join(["%s"] * len(months_to_use))

    if action == "sum":
        query = f"SELECT SUM({column}) AS value FROM sales_data WHERE month IN ({placeholders})"
    elif action == "average":
        query = f"SELECT AVG({column}) AS value FROM sales_data WHERE month IN ({placeholders})"
    elif action in ["max", "min"]:
        order = "DESC" if action == "max" else "ASC"
        query = f"""
            SELECT month, {column}
            FROM sales_data
            WHERE month IN ({placeholders})
            ORDER BY {column} {order}
            LIMIT 1
        """
    else:
        query = f"""
            SELECT month, {column}
            FROM sales_data
            WHERE month IN ({placeholders})
            ORDER BY id
        """

    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(query, tuple(months_to_use))
    rows = cursor.fetchall()
    cursor.close()
    db.close()

    if not rows:
        return {"reply": "Data not available"}

    # ------------------ RESPONSE FORMAT ------------------
    if action == "sum":
        return {"reply": f"Total {category} sales is ₹{round(rows[0]['value'])}"}

    if action == "average":
        return {"reply": f"Average {category} sales is ₹{round(rows[0]['value'])}"}

    if action in ["max", "min"]:
        label = "Highest" if action == "max" else "Lowest"
        return {
            "reply": f"{label} {category} sales was in {rows[0]['month']} with ₹{rows[0][column]}"
        }

    reply = f"{category.capitalize()} sales:\n"
    for r in rows:
        reply += f"{r['month']}: ₹{r[column]}\n"

    return {"reply": reply}


# ------------------ DASHBOARD DATA ------------------
@app.get("/sales-data")
def get_sales_data():
    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT * FROM sales_data ORDER BY id")
    data = cursor.fetchall()

    cursor.close()
    db.close()

    return data
