from http.server import BaseHTTPRequestHandler
import json
import requests
from urllib.parse import urlparse, parse_qs
import sys

class handler(BaseHTTPRequestHandler):
    def _send_response(self, data, status=200):
        """Send JSON response with proper headers"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_GET(self):
        try:
            # Parse query parameter
            query = parse_qs(urlparse(self.path).query).get('query', [None])[0]
            
            if not query:
                return self._send_response(
                    {"status": "error", "message": "Missing query parameter"},
                    status=400
                )

            # Call IP-API (free tier)
            response = requests.get(
                f"http://ip-api.com/json/{query}",
                timeout=5
            )

            # Handle IP-API response
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'fail':
                    return self._send_response(
                        {"status": "error", "message": data.get('message', 'IP lookup failed')},
                        status=404
                    )
                return self._send_response({
                    "status": "success",
                    "data": data
                })
            else:
                return self._send_response(
                    {"status": "error", "message": "IP lookup service unavailable"},
                    status=502
                )

        except requests.exceptions.Timeout:
            return self._send_response(
                {"status": "error", "message": "Request timeout"},
                status=504
            )
        except requests.exceptions.RequestException as e:
            return self._send_response(
                {"status": "error", "message": f"Network error: {str(e)}"},
                status=503
            )
        except Exception as e:
            return self._send_response(
                {"status": "error", "message": f"Internal server error: {str(e)}"},
                status=500
            )

# For local testing
if __name__ == '__main__':
    from http.server import HTTPServer
    server = HTTPServer(('localhost', 8000), handler)
    print("Server running at http://localhost:8000")
    server.serve_forever()