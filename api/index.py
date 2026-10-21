from http.server import BaseHTTPRequestHandler
import os
import json
from google import genai

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        
        # Tampilan Antarmuka Web Interaktif untuk Ojek AI
        html_content = """
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ojek AI - Asisten Perjalanan Anda</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f4f4f9; margin: 0; padding: 20px; display: flex; justify-content: center; }
                .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); width: 100%; max-width: 500px; }
                h2 { color: #2e7d32; text-align: center; }
                textarea { width: 100%; height: 100px; padding: 10px; margin-bottom: 10px; border-radius: 4px; border: 1px solid #ccc; box-sizing: border-box; }
                button { background: #2e7d32; color: white; border: none; padding: 10px 15px; width: 100%; border-radius: 4px; cursor: pointer; font-size: 16px; }
                button:hover { background: #1b5e20; }
                #result { margin-top: 15px; background: #e8f5e9; padding: 10px; border-radius: 4px; white-space: pre-wrap; color: #333; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>🛵 Ojek AI Assistant</h2>
                <p>Mau kemana hari ini? Konsultasikan rute atau pesanan Anda:</p>
                <textarea id="prompt" placeholder="Contoh: Cari rute tercepat dari Stasiun Malang ke Alun-alun..."></textarea>
                <button onclick="askAI()">Tanya Ojek AI</button>
                <div id="result"></div>
            </div>

            <script>
                async function askAI() {
                    const promptText = document.getElementById('prompt').value;
                    const resultDiv = document.getElementById('result');
                    if (!promptText.trim()) {
                        resultDiv.innerText = "Mohon masukkan pertanyaan atau tujuan Anda terlebih dahulu.";
                        return;
                    }
                    resultDiv.innerText = "Sedang mencari rute dan menganalisis...";

                    try {
                        const response = await fetch('/', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ prompt: promptText })
                        });

                        const data = await response.json();
                        resultDiv.innerText = data.reply || data.error;
                    } catch (err) {
                        resultDiv.innerText = "Terjadi kesalahan koneksi ke server.";
                    }
                }
            </script>
        </body>
        </html>
        """
        self.wfile.write(html_content.encode('utf-8'))
        return

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            user_prompt = data.get('prompt', '')

            # Mengambil API Key dari Environment Variable Vercel
            api_key = os.environ.get("GEMINI_API_KEY")
            
            if not api_key:
                reply_text = "Error: GEMINI_API_KEY belum dikonfigurasi di Vercel."
            else:
                # Memanggil Google GenAI SDK (Gemini 2.0 Flash)
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=f"Bertindaklah sebagai asisten cerdas aplikasi ojek online (Ojek AI). Jawablah pertanyaan berikut dengan ramah, informatif, dan membantu seputar transportasi: {user_prompt}"
                )
                reply_text = response.text

        except Exception as e:
            reply_text = f"Terjadi kesalahan pada sistem: {str(e)}"

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response_data = json.dumps({"reply": reply_text})
        self.wfile.write(response_data.encode('utf-8'))
        return
