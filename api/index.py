from http.server import BaseHTTPRequestHandler
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        response_text = "<h1>Aplikasi Ojek AI Berhasil Berjalan!</h1>"
        self.wfile.write(response_text.encode('utf-8'))
        return
