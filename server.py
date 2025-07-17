#!/usr/bin/env python3
"""
No-cache HTTP server for development
Ensures Replit preview always shows latest code changes
"""

import http.server
import socketserver
import sys
from datetime import datetime

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add cache-busting headers
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Last-Modified', datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT'))
        
        # Add security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        
        super().end_headers()

    def log_message(self, format, *args):
        # Enhanced logging with timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {format % args}")

# Get port from command line argument, default to 5000
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
Handler = NoCacheHTTPRequestHandler

print(f"Starting no-cache HTTP server on port {PORT}")
print(f"Server URL: http://0.0.0.0:{PORT}")
print("Cache-busting headers enabled for development")

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    httpd.serve_forever()