"""Serve the current folder on localhost:8000 (convenience wrapper).
Usage: python serve.py [port]
"""
import http.server
import socketserver
import sys

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
Handler = http.server.SimpleHTTPRequestHandler

# try binding; if port in use, try next few ports and report which one succeeded
max_tries = 8
for attempt in range(max_tries):
    try_port = port + attempt
    try:
        with socketserver.TCPServer(("", try_port), Handler) as httpd:
            print(f"Serving at http://localhost:{try_port}/")
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print('\nShutting down')
                httpd.server_close()
            break
    except OSError as e:
        if attempt < max_tries - 1:
            print(f"Port {try_port} unavailable, trying {try_port+1}...")
            continue
        else:
            print(f"Failed to bind to ports {port}-{port+max_tries-1}: {e}")
            sys.exit(1)
