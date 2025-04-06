from http.server import BaseHTTPRequestHandler
import json
import requests
from urllib.parse import urlparse, parse_qs
import sys
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

    def do_GET(self):
        try:
            query = parse_qs(urlparse(self.path).query.get('query', [None])[0]
            if not query:
                return self._send_error(400, "Missing query parameter")

            # Get all data
            result = {
                "overview": self.get_ip_geolocation(query),
                "geoip": self.get_ip_geolocation(query),
                "threat": self.get_threat_data(query),
                "whois": self.get_whois_data(query),
                "timestamp": datetime.utcnow().isoformat()
            }
            self._set_headers()
            self.wfile.write(json.dumps(result).encode())

        except Exception as e:
            self._send_error(500, str(e))

    def get_ip_geolocation(self, query):
        try:
            res = requests.get(f"http://ip-api.com/json/{query}?fields=66842623", timeout=5)
            return res.json()
        except:
            return {"error": "Could not fetch geolocation data"}

    def get_threat_data(self, query):
        try:
            # Use AbuseIPDB public API (no key needed for basic checks)
            res = requests.get(
                "https://api.abuseipdb.com/api/v2/check",
                params={
                    'ipAddress': query,
                    'maxAgeInDays': '90',
                    'verbose': ''
                },
                headers={'Accept': 'application/json'},
                timeout=5
            )
            if res.status_code == 200:
                return res.json().get('data', {})
            return {"error": "Limited threat data available"}
        except:
            return {"error": "Could not fetch threat data"}

    def get_whois_data(self, query):
        try:
            # Use WHOIS API from RIPE for IPs
            if self.is_ip(query):
                res = requests.get(
                    f"https://stat.ripe.net/data/whois/data.json?resource={query}",
                    timeout=5
                )
                if res.status_code == 200:
                    return self._parse_ripe_whois(res.json())
            
            # For domains, use JSONWHOIS
            res = requests.get(
                f"https://jsonwhois.com/api/v1/whois",
                params={'domain': query},
                timeout=5
            )
            if res.status_code == 200:
                return res.json()
            return {"error": "Limited WHOIS data available"}
        except:
            return {"error": "Could not fetch WHOIS data"}

    def _parse_ripe_whois(self, data):
        """Parse RIPE WHOIS data into a simpler format"""
        records = {}
        for record in data.get('data', {}).get('records', []):
            for attr in record.get('attributes', []):
                key = attr.get('key', '').lower()
                value = attr.get('value', '')
                if key and value:
                    if key not in records:
                        records[key] = []
                    records[key].append(value)
        return records

    def is_ip(self, query):
        """Check if query is an IP address"""
        ip_pattern = r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$'
        return re.match(ip_pattern, query) is not None

    def _send_error(self, status, message):
        self._set_headers(status)
        self.wfile.write(json.dumps({
            "status": "error",
            "message": message
        }).encode())

if __name__ == '__main__':
    from http.server import HTTPServer
    server = HTTPServer(('localhost', 8000), handler)
    print("Server running at http://localhost:8000")
    server.serve_forever()