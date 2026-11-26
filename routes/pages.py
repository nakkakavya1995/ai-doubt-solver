from flask import Blueprint, render_template

pages_bp = Blueprint("pages", __name__)

@pages_bp.route("/")
def index():
    return render_template("dashboard.html")

@pages_bp.route("/ask")
def page_ask():
    return render_template("ask.html")

@pages_bp.route("/doubt/<doubt_id>")
def page_doubt_detail(doubt_id):
    return render_template("doubt_detail.html", doubt_id=doubt_id)

@pages_bp.route("/history")
def page_history():
    return render_template("history.html")

@pages_bp.route("/bookmarks")
def page_bookmarks():
    return render_template("bookmarks.html")

@pages_bp.route("/quiz")
def page_quiz():
    return render_template("quiz.html")

@pages_bp.route("/recommendations")
def page_recommendations():
    return render_template("recommendations.html")

@pages_bp.route("/teacher")
def page_teacher():
    return render_template("teacher.html")

@pages_bp.route("/admin")
def page_admin():
    return render_template("admin.html")

@pages_bp.route("/login")
def page_login():
    return render_template("login.html")
