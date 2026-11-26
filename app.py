import os
from flask import Flask
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

init_db()

app.register_blueprint(pages_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(doubts_bp)
app.register_blueprint(quizzes_bp)
app.register_blueprint(study_bp)
app.register_blueprint(teacher_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(notifications_bp)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
