from http.server import BaseHTTPRequestHandler
import json
import requests
from urllib.parse import urlparse, parse_qs
import sys

class handler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
    
    def do_GET(self):
        try:
            query = parse_qs(urlparse(self.path).query).get('query', [None])[0]
            
            if not query:
                self._set_headers(400)
                self.wfile.write(json.dumps({
                    "error": "Missing query parameter"
                }).encode())
                return

            # Example response - replace with your actual logic
            response_data = {
                "status": "success",
                "query": query,
                "data": {
                    "ip": "8.8.8.8",
                    "country": "United States",
                    "isp": "Google LLC"
                }
            }
            
            self._set_headers()
            self.wfile.write(json.dumps(response_data).encode())

        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({
                "error": str(e)
            }).encode())