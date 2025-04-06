from http.server import BaseHTTPRequestHandler
import json
import requests
from urllib.parse import urlparse, parse_qs
import sys

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            query_components = parse_qs(urlparse(self.path).query)
            ioc = query_components.get("query", [None])[0]

            if not ioc:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing query parameter"}).encode())
                return

            url = f"http://ip-api.com/json/{ioc}"
            response = requests.get(url)
            response.raise_for_status()  # Raises an error for HTTP issues
            result = response.json()

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())

        except Exception as e:
            print("ERROR:", str(e), file=sys.stderr)  # Logs to Vercel
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Internal server error", "details": str(e)}).encode())