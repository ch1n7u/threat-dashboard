import json
import requests
import psycopg2
import os

def handler(request):
    query = request.args.get("query", "")
    if not query:
        return {"statusCode": 400, "body": "Missing query param"}

    # Lookup using ip-api
    ip_resp = requests.get(f"http://ip-api.com/json/{query}")
    data = ip_resp.json()

    # Connect to Supabase
    try:
        conn = psycopg2.connect(os.environ["SUPABASE_DB_URL"])
        cur = conn.cursor()
        cur.execute("INSERT INTO ioc_logs (query, type, result) VALUES (%s, %s, %s)",
                    (query, 'ip', json.dumps(data)))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        return {
            "statusCode": 500,
            "body": f"DB error: {str(e)}"
        }

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(data)
    }
