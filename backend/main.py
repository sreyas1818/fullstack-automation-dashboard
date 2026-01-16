from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import get_db
import requests   # ✅ NEW (for Ollama)

app = FastAPI()

# Allow React access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- Models --------
class LoginData(BaseModel):
    username: str
    password: str

# ✅ NEW: Chat request model
class ChatRequest(BaseModel):
    message: str


# -------- Login API --------
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


# -------- Fetch Transactions --------
@app.get("/transactions")
def get_transactions():
    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT * FROM transactions ORDER BY created_at DESC")
    data = cursor.fetchall()

    cursor.close()
    db.close()

    return data


# ==================================================
# 🤖 OLLAMA PHI CHATBOT API (NEW)
# ==================================================

OLLAMA_URL = "http://localhost:11434/api/generate"

@app.post("/chat")
def chat(req: ChatRequest):
    payload = {
        "model": "phi",
        "prompt": req.message,
        "stream": False
    }

    try:
        res = requests.post(OLLAMA_URL, json=payload, timeout=60)
        res.raise_for_status()
        result = res.json()

        return {
            "reply": result.get("response", "No response from model")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/sales-data")
def get_sales_data():
    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT * FROM sales_data ORDER BY id")
    data = cursor.fetchall()

    cursor.close()
    db.close()

    return data

