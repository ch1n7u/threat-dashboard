from http.server import BaseHTTPRequestHandler
import json
import requests
from urllib.parse import urlparse, parse_qs
import sys
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def _send_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_GET(self):
        try:
            query = parse_qs(urlparse(self.path).query.get('query', [None])[0]
            if not query:
                return self._send_response({"error": "Missing query parameter"}, 400)

            # Get all data
            result = {
                "overview": self.get_ip_geolocation(query),
                "geoip": self.get_ip_geolocation(query),
                "threat": self.get_threat_data(query),
                "whois": self.get_whois_data(query),
                "timestamp": datetime.utcnow().isoformat()
            }
            self._send_response(result)

        except Exception as e:
            self._send_response({"error": str(e)}, 500)

    def get_ip_geolocation(self, query):
        try:
            res = requests.get(f"http://ip-api.com/json/{query}", timeout=5)
            return res.json()
        except:
            return {"error": "Could not fetch geolocation data"}

    def get_threat_data(self, query):
        try:
            # AbuseIPDB public API (no key needed for basic checks)
            res = requests.get(
                f"https://api.abuseipdb.com/api/v2/check",
                params={'ipAddress': query, 'maxAgeInDays': '90'},
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
            # Free WHOIS API (no key needed)
            res = requests.get(
                f"https://www.whoisxmlapi.com/whoisserver/WhoisService",
                params={
                    'domainName': query,
                    'outputFormat': 'JSON',
                    'da': '1'  # Try to get most recent data
                },
                timeout=5
            )
            if res.status_code == 200:
                return res.json()
            return {"error": "Limited WHOIS data available"}
        except:
            return {"error": "Could not fetch WHOIS data"}