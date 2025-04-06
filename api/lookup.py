from http.server import BaseHTTPRequestHandler
import json
import requests
from urllib.parse import urlparse, parse_qs
import sys
import re
from datetime import datetime

# Cache setup (in-memory for simplicity)
CACHE = {}
CACHE_DURATION = 300  # 5 minutes in seconds

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Parse query parameters
            query_params = parse_qs(urlparse(self.path).query
            query = query_params.get('query', [None])[0]
            
            if not query:
                return self.send_error_response(400, "Missing query parameter")
            
            # Check cache first
            cached_data = self.check_cache(query)
            if cached_data:
                return self.send_json_response(cached_data)
            
            # Determine if query is IP or domain
            if self.is_ip_address(query):
                data = self.handle_ip_query(query)
            else:
                data = self.handle_domain_query(query)
            
            # Cache the result
            self.add_to_cache(query, data)
            self.send_json_response(data)
            
        except Exception as e:
            self.log_error(e)
            return self.send_error_response(500, f"Internal server error: {str(e)}")

    def handle_ip_query(self, ip):
        """Handle IP address lookup"""
        # Get IP geolocation
        geo_data = self.get_ip_geolocation(ip)
        
        # Get threat intelligence (simplified)
        threat_data = {
            "abuseConfidenceScore": 0,
            "isPublic": True,
            "isWhitelisted": False,
            "reports": []
        }
        
        return {
            "type": "ip",
            "query": ip,
            "geo": geo_data,
            "threat": threat_data,
            "timestamp": datetime.utcnow().isoformat()
        }

    def handle_domain_query(self, domain):
        """Handle domain lookup"""
        # Get WHOIS data (simplified)
        whois_data = {
            "registrar": "Unknown",
            "creationDate": None,
            "expirationDate": None,
            "nameServers": []
        }
        
        # Get IP resolution
        resolved_ips = self.resolve_domain(domain)
        
        return {
            "type": "domain",
            "query": domain,
            "whois": whois_data,
            "resolvedIPs": resolved_ips,
            "timestamp": datetime.utcnow().isoformat()
        }

    def get_ip_geolocation(self, ip):
        """Get geolocation data from IP-API"""
        try:
            url = f"http://ip-api.com/json/{ip}?fields=66842623"
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self.log_error(f"IP-API error: {str(e)}")
            return {"error": "Could not fetch geolocation data"}

    def resolve_domain(self, domain):
        """Simple domain resolution (mock)"""
        return ["8.8.8.8"]  # Mock response

    def is_ip_address(self, query):
        """Check if query is an IP address"""
        ip_pattern = r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$'
        return re.match(ip_pattern, query) is not None

    def check_cache(self, query):
        """Check if query exists in cache and is still valid"""
        if query in CACHE:
            cached_entry = CACHE[query]
            age = (datetime.utcnow() - cached_entry['timestamp']).total_seconds()
            if age < CACHE_DURATION:
                return cached_entry['data']
        return None

    def add_to_cache(self, query, data):
        """Add result to cache"""
        CACHE[query] = {
            'data': data,
            'timestamp': datetime.utcnow()
        }

    def send_json_response(self, data, status=200):
        """Send JSON response with proper headers"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def send_error_response(self, status, message):
        """Send error response"""
        error_data = {
            "status": "error",
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.send_json_response(error_data, status)

    def log_error(self, error):
        """Log errors to stderr (visible in Vercel logs)"""
        timestamp = datetime.utcnow().isoformat()
        error_msg = f"[{timestamp}] ERROR: {str(error)}"
        print(error_msg, file=sys.stderr)
        if hasattr(error, '__traceback__'):
            import traceback
            traceback.print_exc(file=sys.stderr)