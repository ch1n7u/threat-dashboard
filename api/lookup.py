from http.server import BaseHTTPRequestHandler
import json
import requests
from urllib.parse import urlparse, parse_qs
import sys
import re

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Set headers
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Parse query parameters
            query = parse_qs(urlparse(self.path).get('query', [None])[0]
            query_type = parse_qs(urlparse(self.path).get('type', ['auto'])[0]
            
            if not query:
                response = {"error": "Missing query parameter"}
                self.wfile.write(json.dumps(response).encode())
                return
            
            # Validate and normalize the query
            query = self.normalize_query(query, query_type)
            
            # Initialize response data
            data = {"query": query, "status": "success"}
            
            # Get IP geolocation data (always available)
            ip_data = self.get_ip_data(query)
            data.update(ip_data)
            
            # If this is an IP address, get threat data
            if self.is_ip(query):
                abuse_data = self.get_abuseipdb_data(query)
                if abuse_data:
                    data["abuseData"] = abuse_data
            
            # If this is a domain, get WHOIS data
            if not self.is_ip(query):
                whois_data = self.get_whois_data(query)
                if whois_data:
                    data["whois"] = whois_data
            
            self.wfile.write(json.dumps(data).encode())
            
        except Exception as e:
            print("ERROR:", str(e), file=sys.stderr)
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {"error": str(e), "status": "fail"}
            self.wfile.write(json.dumps(response).encode())
    
    def normalize_query(self, query, query_type):
        """Clean and validate the query input"""
        query = query.strip().lower()
        
        # Remove protocol if present
        if query.startswith(('http://', 'https://')):
            query = query.split('://')[1]
        
        # Remove paths and ports
        query = query.split('/')[0]
        query = query.split(':')[0]
        
        # Validate based on type
        if query_type == 'ip' and not self.is_ip(query):
            raise ValueError("Invalid IP address provided")
        elif query_type == 'domain' and self.is_ip(query):
            raise ValueError("Domain expected but IP address provided")
        
        return query
    
    def is_ip(self, query):
        """Check if the query is an IP address"""
        ip_pattern = r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$'
        return re.match(ip_pattern, query) is not None
    
    def get_ip_data(self, query):
        """Get geolocation data from IP-API"""
        try:
            url = f"http://ip-api.com/json/{query}?fields=66842623"
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"IP-API error: {str(e)}")
            return {"error": "Could not fetch geolocation data"}
    
    def get_abuseipdb_data(self, ip):
        """Get threat data from AbuseIPDB (limited free tier)"""
        try:
            # Note: In a real implementation, you'd need an API key
            # This is a mock implementation to avoid hitting rate limits
            return {
                "abuseConfidenceScore": 0,
                "totalReports": 0,
                "lastReportedAt": None,
                "reports": []
            }
            
            # Actual implementation would look like:
            # url = f"https://api.abuseipdb.com/api/v2/check?ipAddress={ip}"
            # headers = {"Key": "YOUR_API_KEY", "Accept": "application/json"}
            # response = requests.get(url, headers=headers, timeout=5)
            # response.raise_for_status()
            # return response.json()["data"]
        except Exception as e:
            print(f"AbuseIPDB error: {str(e)}")
            return None
    
    def get_whois_data(self, domain):
        """Get WHOIS data (mock implementation)"""
        try:
            # Note: In a real implementation, you'd use a WHOIS API
            # This is a mock to avoid hitting rate limits
            return f"WHOIS data for {domain}\n\nThis is mock WHOIS data. In a real implementation, you would see registration details here."
            
            # Actual implementation might use:
            # url = f"https://www.whoisxmlapi.com/whoisserver/WhoisService?domainName={domain}&outputFormat=JSON"
            # response = requests.get(url, timeout=5)
            # response.raise_for_status()
            # return response.text
        except Exception as e:
            print(f"WHOIS error: {str(e)}")
            return None