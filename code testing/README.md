# NovaCalc — Advanced Scientific Calculator (Static Web)

This is a single-folder static web application implementing a scientific calculator (`NovaCalc`). It uses a custom expression parser (shunting-yard -> RPN) and no external dependencies.

Quick start (PowerShell):

```powershell
# serve files on port 8000
python -m http.server 8000

# then open http://localhost:8000/ in your browser
```

Or use the provided `serve.py` script:

```powershell
python serve.py
```

Files added:
- `index.html` — main UI
- `styles.css` — styling and theme
- `app.js` — evaluator and UI logic
- `serve.py` — convenience server (calls Python http.server)

Features:
- Expression evaluation with functions: sin, cos, tan, asin, acos, atan, ln, log, sqrt, exp, factorial (!), ^ operator
- Angle mode toggle (DEG/RAD)
- Memory (M+, M-, MR, MC)
- History panel with quick reuse
- Keyboard support and copy result

If you'd like a build step, progressive web app features, or integration with frameworks (React/Vue), I can scaffold that next.
