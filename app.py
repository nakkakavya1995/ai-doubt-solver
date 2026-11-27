import os, threading, time, urllib.request
from flask import Flask, request, Response
from flask_cors import CORS
from db import init_db
from routes.pages import pages_bp
from routes.auth import auth_bp
from routes.doubts import doubts_bp
from routes.quizzes import quizzes_bp
from routes.study import study_bp
from routes.teacher import teacher_bp
from routes.admin import admin_bp
from routes.notifications import notifications_bp

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "academic-doubt-solver-key")
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024
CORS(app)

try:
    init_db()
except Exception as e:
    pass

app.register_blueprint(pages_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(doubts_bp)
app.register_blueprint(quizzes_bp)
app.register_blueprint(study_bp)
app.register_blueprint(teacher_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(notifications_bp)

@app.route("/favicon.ico")
def favicon():
    svg_icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">✦</text></svg>'
    resp = Response(svg_icon, mimetype="image/svg+xml")
    resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return resp

def _keep_awake():
    time.sleep(30)
    target_url = os.getenv("RENDER_EXTERNAL_URL", "https://ai-doubt-solver-lesr.onrender.com")
    while True:
        try:
            req = urllib.request.Request(f"{target_url}/api/subjects", headers={"User-Agent": "KeepAlive/1.0"})
            with urllib.request.urlopen(req, timeout=10) as r:
                r.read()
        except Exception:
            pass
        time.sleep(600)

_t = threading.Thread(target=_keep_awake, daemon=True)
_t.start()

@app.after_request
def set_security_headers(response):
    response.headers["Cross-Origin-Opener-Policy"] = "unsafe-none"
    if request.path.startswith("/static/") or request.path == "/favicon.ico":
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    else:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
