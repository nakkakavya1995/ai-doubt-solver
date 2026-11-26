import os
import uuid
import base64
from datetime import datetime
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import fitz
from db import clean_doc, doubts_col, users_col, notifications_col
from grok_service import solve_doubt_with_grok, generate_followup_answer, generate_practice_problems
from routes.helpers import get_doubt_filter, trigger_desktop_notification

doubts_bp = Blueprint("doubts", __name__)

@doubts_bp.route("/api/doubts", methods=["GET"])
def get_doubts():
    subject = request.args.get("subject")
    level = request.args.get("level")
    status = request.args.get("status")
    bookmarked = request.args.get("bookmarked")
    search = request.args.get("search", "").strip().lower()
    user_id = request.args.get("user_id")
    role = request.args.get("role")

    query = {}
    if user_id and role == "student":
        query["user_id"] = user_id
    if subject and subject != "All":
        query["subject"] = {"$regex": f"^{subject}$", "$options": "i"}
    if level and level != "All":
        query["explanation_level"] = level
    if status and status != "All":
        query["status"] = status
    if bookmarked == "true":
        query["bookmarked"] = True

    try:
        docs = list(doubts_col.find(query).sort("created_at", -1))
        cleaned = clean_doc(docs)
    except Exception:
        cleaned = []

    if search:
        cleaned = [
            d for d in cleaned
            if search in d.get("title", "").lower()
            or search in d.get("question", "").lower()
            or search in d.get("subject", "").lower()
        ]

    return jsonify(cleaned)

@doubts_bp.route("/api/doubts/<doubt_id>", methods=["GET"])
def get_doubt(doubt_id):
    doubt = doubts_col.find_one(get_doubt_filter(doubt_id))
    if not doubt:
        return jsonify({"error": "Doubt not found"}), 404
    return jsonify(clean_doc(doubt))

@doubts_bp.route("/api/doubts", methods=["POST"])
def create_doubt():
    if request.is_json:
        data = request.get_json() or {}
        title = data.get("title", "").strip()
        question = data.get("question", "").strip()
        subject = data.get("subject", "Mathematics")
        explanation_level = data.get("explanation_level") or data.get("level", "intermediate")
        input_type = data.get("type", "text")
        code_snippet = data.get("code_snippet", "").strip()
        code_language = data.get("code_language", "")
        user_id = data.get("user_id", "u-student-1")
        user_name = data.get("user_name", "Alex Rivera")
        file = None
        attachment_meta = data.get("attachment")
        document_text = ""
        image_base64 = ""
        if attachment_meta and isinstance(attachment_meta, dict):
            document_text = attachment_meta.get("extracted_text", "")
            image_base64 = attachment_meta.get("base64", "")
            if not input_type or input_type == "text":
                input_type = attachment_meta.get("type", "document" if "pdf" in attachment_meta.get("mimetype", "") else "image")
    else:
        title = request.form.get("title", "").strip()
        question = request.form.get("question", "").strip()
        subject = request.form.get("subject", "Mathematics")
        explanation_level = request.form.get("explanation_level", "intermediate")
        input_type = request.form.get("type", "text")
        code_snippet = request.form.get("code_snippet", "").strip()
        code_language = request.form.get("code_language", "")
        user_id = request.form.get("user_id", "u-student-1")
        user_name = request.form.get("user_name", "Alex Rivera")
        file = request.files.get("attachment")
        document_text = ""
        image_base64 = ""
        attachment_meta = None

    if file and file.filename:
        filename = secure_filename(file.filename)
        file_bytes = file.read()
        mimetype = file.mimetype

        if "pdf" in mimetype or filename.lower().endswith(".pdf"):
            try:
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                extracted = []
                for page in doc:
                    extracted.append(page.get_text())
                document_text = "\n".join(extracted)
            except Exception:
                pass
            attachment_meta = {
                "name": filename,
                "type": "document",
                "mimetype": mimetype
            }
        elif mimetype.startswith("image/") or filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp")):
            actual_mime = mimetype if mimetype.startswith("image/") else ("image/png" if filename.lower().endswith(".png") else "image/jpeg")
            b64_str = base64.b64encode(file_bytes).decode("utf-8")
            image_base64 = f"data:{actual_mime};base64,{b64_str}"
            attachment_meta = {
                "name": filename,
                "type": "image",
                "preview_url": image_base64
            }
        else:
            try:
                document_text = file_bytes.decode("utf-8")
            except Exception:
                pass
            attachment_meta = {
                "name": filename,
                "type": "document",
                "mimetype": mimetype
            }

    if not question and not file and not code_snippet and not attachment_meta:
        return jsonify({"error": "Question description, code snippet or uploaded file required"}), 400

    solution = solve_doubt_with_grok(
        question=question or f"Solve question from uploaded {attachment_meta.get('name') if attachment_meta else 'document'}",
        subject=subject,
        explanation_level=explanation_level,
        code_snippet=code_snippet,
        code_language=code_language,
        document_text=document_text,
        image_base64=image_base64
    )

    doubt_id = f"d-{uuid.uuid4().hex[:8]}"
    doubt_doc = {
        "id": doubt_id,
        "user_id": user_id,
        "user_name": user_name,
        "title": title or (question[:60] if question else (f"Code inquiry in {code_language.capitalize()}" if code_snippet else (f"Problem from {attachment_meta.get('name')}" if attachment_meta and attachment_meta.get('name') != 'File' else f"Doubt in {subject}"))),
        "question": question or (code_snippet if code_snippet else ((solution.get("summary") if solution and solution.get("summary") else f"Problem statement from {attachment_meta.get('name')}") if attachment_meta and attachment_meta.get('name') != 'File' else (solution.get("summary") if solution and solution.get("summary") else f"Academic doubt in {subject}"))),
        "subject": subject,
        "explanation_level": explanation_level,
        "type": input_type,
        "code_snippet": code_snippet or None,
        "code_language": code_language or None,
        "attachment": attachment_meta,
        "solution": solution,
        "status": "solved",
        "bookmarked": False,
        "follow_ups": [],
        "feedback": None,
        "teacher_review": None,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    doubts_col.insert_one(doubt_doc)

    notifications_col.insert_one({
        "id": f"n-{uuid.uuid4().hex[:8]}",
        "user_id": user_id,
        "title": "AI Solution Ready",
        "message": f"Step-by-step solution generated for '{doubt_doc['title']}'.",
        "read": False,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "link": doubt_id
    })
    notifications_col.insert_one({
        "id": f"n-{uuid.uuid4().hex[:8]}",
        "role_target": "teacher",
        "title": "New Question Submitted",
        "message": f"Student submitted a new question: '{doubt_doc['title']}'.",
        "read": False,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "link": doubt_id
    })
    trigger_desktop_notification("AI Solution Ready", f"Step-by-step solution generated for '{doubt_doc['title']}'.")

    return jsonify(clean_doc(doubt_doc)), 201

@doubts_bp.route("/api/doubts/<doubt_id>/follow-up", methods=["POST"])
def add_followup(doubt_id):
    data = request.get_json() or {}
    message = data.get("message", "").strip()
    if not message:
        return jsonify({"error": "Message cannot be empty"}), 400

    doubt = doubts_col.find_one(get_doubt_filter(doubt_id))
    if not doubt:
        return jsonify({"error": "Doubt not found"}), 404

    student_msg = {
        "id": f"f-{uuid.uuid4().hex[:8]}",
        "sender": "student",
        "text": message,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    ai_reply_text = generate_followup_answer(
        question=doubt.get("question", ""),
        previous_solution=doubt.get("solution", {}),
        follow_up_message=message
    )

    ai_msg = {
        "id": f"f-{uuid.uuid4().hex[:8]}",
        "sender": "ai",
        "text": ai_reply_text,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    doubts_col.update_one(
        get_doubt_filter(doubt_id),
        {"$push": {"follow_ups": {"$each": [student_msg, ai_msg]}}}
    )

    notifications_col.insert_one({
        "id": f"n-{uuid.uuid4().hex[:8]}",
        "user_id": doubt.get("user_id"),
        "title": "Follow-Up Response Ready",
        "message": f"AI responded to your follow-up query on '{doubt.get('title')}'.",
        "read": False,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "link": doubt_id
    })

    updated_doubt = doubts_col.find_one(get_doubt_filter(doubt_id))
    return jsonify({"student_msg": student_msg, "ai_msg": ai_msg, "doubt": clean_doc(updated_doubt)})

@doubts_bp.route("/api/doubts/<doubt_id>/bookmark", methods=["POST"])
def toggle_bookmark(doubt_id):
    doubt = doubts_col.find_one(get_doubt_filter(doubt_id))
    if not doubt:
        return jsonify({"error": "Doubt not found"}), 404

    new_state = not doubt.get("bookmarked", False)
    doubts_col.update_one(get_doubt_filter(doubt_id), {"$set": {"bookmarked": new_state}})
    return jsonify({"bookmarked": new_state})

@doubts_bp.route("/api/doubts/<doubt_id>/feedback", methods=["POST"])
def submit_feedback(doubt_id):
    data = request.get_json() or {}
    rating = int(data.get("rating", 5))
    comment = data.get("comment", "").strip()
    helpful = data.get("helpful", True)
    report_issue = bool(data.get("report_issue", False))

    doubt = doubts_col.find_one(get_doubt_filter(doubt_id))
    if not doubt:
        return jsonify({"error": "Doubt not found"}), 404

    feedback_doc = {
        "rating": rating,
        "comment": comment,
        "helpful": helpful,
        "report_issue": report_issue,
        "submitted_at": datetime.utcnow().isoformat() + "Z"
    }

    update_fields = {"feedback": feedback_doc}
    if report_issue:
        update_fields["status"] = "flagged"
        notifications_col.insert_one({
            "id": f"n-{uuid.uuid4().hex[:8]}",
            "role_target": "teacher",
            "title": "Clarification Requested by Student",
            "message": f"Student requested clarification for '{doubt.get('title')}'. Teacher review requested.",
            "read": False,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "link": doubt_id
        })
        trigger_desktop_notification("Clarification Requested", f"Student requested clarification for '{doubt.get('title')}'.")

    doubts_col.update_one(get_doubt_filter(doubt_id), {"$set": update_fields})
    return jsonify({"message": "Feedback submitted successfully", "feedback": feedback_doc})

@doubts_bp.route("/api/doubts/<doubt_id>/practice", methods=["POST"])
def generate_practice_from_doubt(doubt_id):
    doubt = doubts_col.find_one(get_doubt_filter(doubt_id))
    if not doubt:
        return jsonify({"error": "Doubt not found"}), 404

    topic = doubt.get("solution", {}).get("key_takeaway") or doubt.get("title", "")
    problems = generate_practice_problems(
        topic=topic,
        subject=doubt.get("subject", "Mathematics"),
        difficulty=doubt.get("explanation_level", "intermediate")
    )
    return jsonify({"topic": topic, "problems": problems})

@doubts_bp.route("/api/doubts/learned-topics", methods=["GET"])
def get_learned_topics():
    user_id = request.args.get("user_id")
    query = {}
    if user_id:
        query = {"$or": [{"user_id": user_id}, {"user_id": {"$exists": False}}]}
    doubts = list(doubts_col.find(query).sort("created_at", -1))
    topics = []
    seen = set()
    for d in doubts:
        sol = d.get("solution") or {}
        topic_title = (sol.get("key_takeaway") or d.get("title") or "").strip()
        if not topic_title:
            continue
        cleaned_key = topic_title.lower()
        if cleaned_key in seen:
            continue
        seen.add(cleaned_key)
        topics.append({
            "doubt_id": str(d.get("id") or d.get("_id")),
            "topic": topic_title,
            "title": d.get("title", topic_title),
            "subject": d.get("subject", "Mathematics"),
            "level": d.get("explanation_level", "intermediate")
        })
    return jsonify(topics)

@doubts_bp.route("/api/practice/generate-topic-questions", methods=["POST"])
def generate_topic_questions():
    data = request.get_json() or {}
    topic = data.get("topic", "").strip()
    subject = data.get("subject", "Mathematics").strip()
    difficulty = data.get("difficulty", "intermediate").strip()
    doubt_id = data.get("doubt_id")
    if not topic and doubt_id:
        doubt = doubts_col.find_one(get_doubt_filter(doubt_id))
        if doubt:
            topic = doubt.get("solution", {}).get("key_takeaway") or doubt.get("title", "")
            subject = doubt.get("subject", subject)
            difficulty = doubt.get("explanation_level", difficulty)
    if not topic:
        topic = "General Academic Practice"
    problems = generate_practice_problems(
        topic=topic,
        subject=subject,
        difficulty=difficulty
    )
    return jsonify({
        "topic": topic,
        "subject": subject,
        "difficulty": difficulty,
        "problems": problems
    })

@doubts_bp.route("/api/doubts/<doubt_id>", methods=["DELETE"])
def delete_doubt(doubt_id):
    res = doubts_col.delete_one(get_doubt_filter(doubt_id))
    if res.deleted_count == 0:
        return jsonify({"error": "Doubt not found"}), 404
    return jsonify({"message": "Doubt deleted successfully"})

