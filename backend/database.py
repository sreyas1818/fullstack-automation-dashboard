import mysql.connector

def get_db():
    return mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="",        # add if you set one
        database="pdf_payments",
        port=3306,
        connection_timeout=5
    )
