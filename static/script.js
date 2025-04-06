from http.server import BaseHTTPRequestHandler
import json
import requests
from urllib.parse import urlparse, parse_qs
import sys
import re

class handler(BaseHTTPRequestHandler):
    def _set_headers(self, content_type='application/json', status_code=200):
        self.send_response(status_code)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

    def do_GET(self):
        try:
            query = parse_qs(urlparse(self.path).query.get('query', [None])[0]
            
            if not query:
                return self._send_error("Missing query parameter", 400)
            
            # Validate input
            if not self._is_valid_query(query):
                return self._send_error("Invalid query format", 400)

            # Get all data
            result = {
                "status": "success",
                "data": {
                    "geoip": self._get_geoip_data(query),
                    "threat": self._get_threat_data(query),
                    "whois": self._get_whois_data(query)
                }
            }
            
            self._set_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self._send_error(f"Internal server error: {str(e)}", 500)

    def _is_valid_query(self, query):
        """Validate if query is IP or domain"""
        ip_pattern = r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$'
        domain_pattern = r'^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$'
        return re.match(ip_pattern, query) or re.match(domain_pattern, query)

    def _get_geoip_data(self, query):
        """Get geolocation data from IP-API"""
        try:
            response = requests.get(f"http://ip-api.com/json/{query}", timeout=5)
            if response.status_code == 200:
                return response.json()
            return {"error": "Geolocation service unavailable"}
        except Exception as e:
            return {"error": str(e)}

    def _get_threat_data(self, query):
        """Get threat data from AbuseIPDB"""
        try:
            if not self._is_valid_ip(query):
                return {"error": "Threat data only available for IP addresses"}
                
            response = requests.get(
                "https://api.abuseipdb.com/api/v2/check",
                params={
                    'ipAddress': query,
                    'maxAgeInDays': '90',
                    'verbose': ''
                },
                headers={'Accept': 'application/json'},
                timeout=5
            )
            
            if response.status_code == 200:
                return response.json().get('data', {})
            return {"error": "Threat data service unavailable"}
        except Exception as e:
            return {"error": str(e)}

    def _get_whois_data(self, query):
        """Get WHOIS data from appropriate source"""
        try:
            if self._is_valid_ip(query):
                # Use RIPE for IP addresses
                response = requests.get(
                    f"https://stat.ripe.net/data/whois/data.json?resource={query}",
                    timeout=5
                )
                if response.status_code == 200:
                    return self._parse_ripe_whois(response.json())
            else:
                # Use JSONWHOIS for domains
                response = requests.get(
                    "https://jsonwhois.com/api/v1/whois",
                    params={'domain': query},
                    timeout=5
                )
                if response.status_code == 200:
                    return response.json()
            
            return {"error": "WHOIS service unavailable"}
        except Exception as e:
            return {"error": str(e)}

    def _parse_ripe_whois(self, data):
        """Parse RIPE WHOIS data into simpler format"""
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

    def _is_valid_ip(self, query):
        """Check if query is an IP address"""
        ip_pattern = r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$'
        return re.match(ip_pattern, query) is not None

    def _send_error(self, message, status_code=400):
        """Send error response in JSON format"""
        self._set_headers(status_code=status_code)
        error_response = {
            "status": "error",
            "message": message
        }
        self.wfile.write(json.dumps(error_response).encode())

if __name__ == '__main__':
    from http.server import HTTPServer
    server = HTTPServer(('localhost', 8000), handler)
    print("Server running at http://localhost:8000")
    server.serve_forever()