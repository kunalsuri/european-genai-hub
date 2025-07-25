#!/usr/bin/env python3
"""
Simple HTTP server for development
"""

import http.server
import socketserver
import socket

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add cache-busting headers
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

PORT = 5000

# Enable address reuse
class ReuseAddrTCPServer(socketserver.TCPServer):
    def __init__(self, server_address, RequestHandlerClass):
        super().__init__(server_address, RequestHandlerClass)
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

print(f"Serving on port {PORT}")
with ReuseAddrTCPServer(("0.0.0.0", PORT), NoCacheHTTPRequestHandler) as httpd:
    httpd.serve_forever()