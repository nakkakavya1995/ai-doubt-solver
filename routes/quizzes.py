import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from db import clean_doc, quizzes_col, doubts_col, notifications_col
from grok_service import generate_quiz_questions
from routes.helpers import trigger_desktop_notification

quizzes_bp = Blueprint("quizzes", __name__)

def get_quiz_filter(quiz_id):
    try:
        return {"$or": [{"id": quiz_id}, {"_id": ObjectId(quiz_id)}]}
    except Exception:
        return {"id": quiz_id}

@quizzes_bp.route("/api/quizzes", methods=["GET"])
def get_all_quizzes():
    user_id = request.args.get("user_id")
    query = {}
    if user_id:
        query = {"$or": [{"user_id": user_id}, {"user_id": {"$exists": False}}]}
    try:
        docs = list(quizzes_col.find(query).sort("created_at", -1))
        return jsonify(clean_doc(docs))
    except Exception:
        return jsonify([])

@quizzes_bp.route("/api/quizzes/<quiz_id>", methods=["GET"])
def get_single_quiz(quiz_id):
    doc = quizzes_col.find_one(get_quiz_filter(quiz_id))
    if not doc:
        return jsonify({"error": "Quiz not found"}), 404
    return jsonify(clean_doc(doc))

@quizzes_bp.route("/api/quizzes/generate", methods=["POST"])
def generate_practice_quiz():
    data = request.get_json() or {}
    topic = data.get("topic", "").strip() or "General Academic Foundations"
    subject = data.get("subject", "Mathematics")
    difficulty = data.get("difficulty", "Medium")
    count = int(data.get("count", 5))
    user_id = data.get("user_id", "u-student-1")
    user_name = data.get("user_name", "Alex Rivera")

    diff_map = {"Easy": "simplified", "Medium": "intermediate", "Hard": "detailed"}
    level_for_grok = diff_map.get(difficulty, difficulty.lower())

    questions = generate_quiz_questions(
        subject=subject,
        topic=topic,
        count=count,
        difficulty=level_for_grok
    )

    quiz_id = f"quiz-{uuid.uuid4().hex[:8]}"
    quiz_doc = {
        "id": quiz_id,
        "user_id": user_id,
        "user_name": user_name,
        "topic": topic,
        "subject": subject,
        "difficulty": difficulty,
        "question_count": len(questions),
        "questions": questions,
        "status": "In Progress",
        "score": None,
        "user_answers": {},
        "created_at": datetime.utcnow().isoformat() + "Z",
        "completed_at": None
    }
    quizzes_col.insert_one(quiz_doc)
    return jsonify(clean_doc(quiz_doc)), 201

@quizzes_bp.route("/api/quizzes/<quiz_id>/submit", methods=["POST"])
def submit_quiz_attempt(quiz_id):
    data = request.get_json() or {}
    answers = data.get("answers", {})

    quiz = quizzes_col.find_one(get_quiz_filter(quiz_id))
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    questions = quiz.get("questions", [])
    correct_count = 0
    total = len(questions)

    for q in questions:
        q_id_str = str(q.get("id"))
        chosen = answers.get(q_id_str)
        if chosen is None and q_id_str.isdigit():
            chosen = answers.get(int(q_id_str))
        if chosen is not None and int(chosen) == int(q.get("correct_index", 0)):
            correct_count += 1

    pct = round((correct_count / total * 100)) if total > 0 else 0
    score_doc = {
        "correct": correct_count,
        "total": total,
        "percentage": pct,
        "display": f"{correct_count} / {total} ({pct}%)"
    }

    quizzes_col.update_one(
        get_quiz_filter(quiz_id),
        {
            "$set": {
                "status": "Completed",
                "score": score_doc,
                "user_answers": answers,
                "completed_at": datetime.utcnow().isoformat() + "Z"
            }
        }
    )

    notifications_col.insert_one({
        "id": f"n-{uuid.uuid4().hex[:8]}",
        "user_id": quiz.get("user_id"),
        "title": "Quiz Completed",
        "message": f"You scored {correct_count}/{total} ({pct}%) on '{quiz.get('topic')}'.",
        "read": False,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "link": "/quiz"
    })
    trigger_desktop_notification("Quiz Completed", f"You scored {correct_count}/{total} ({pct}%) on '{quiz.get('topic')}'.")

    updated = quizzes_col.find_one(get_quiz_filter(quiz_id))
    return jsonify(clean_doc(updated))

@quizzes_bp.route("/api/quizzes/<quiz_id>/retake", methods=["POST"])
def retake_quiz(quiz_id):
    quiz = quizzes_col.find_one(get_quiz_filter(quiz_id))
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    quizzes_col.update_one(
        get_quiz_filter(quiz_id),
        {
            "$set": {
                "status": "In Progress",
                "score": None,
                "user_answers": {},
                "completed_at": None
            }
        }
    )
    updated = quizzes_col.find_one(get_quiz_filter(quiz_id))
    return jsonify(clean_doc(updated))

@quizzes_bp.route("/api/quiz/generate", methods=["POST"])
def create_quiz():
    data = request.get_json() or {}
    subject = data.get("subject", "Mathematics")
    topic = data.get("topic", "Calculus Invariants")
    count = int(data.get("count", 5))
    difficulty = data.get("difficulty", "intermediate")

    questions = generate_quiz_questions(
        subject=subject,
        topic=topic,
        count=count,
        difficulty=difficulty
    )
    return jsonify({
        "subject": subject,
        "topic": topic,
        "difficulty": difficulty,
        "questions": questions
    })

