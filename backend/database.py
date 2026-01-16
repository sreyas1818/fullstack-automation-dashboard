import mysql.connector

def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="pdf_payments"   # ✅ DB where sales_data exists
    )
