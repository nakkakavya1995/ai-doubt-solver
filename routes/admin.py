import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from db import clean_doc, users_col, doubts_col, subjects_col, settings_col, quizzes_col, notifications_col
from routes.helpers import trigger_desktop_notification

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/api/admin/stats", methods=["GET"])
def admin_stats():
    total_users = users_col.count_documents({})
    students = users_col.count_documents({"role": "student"})
    teachers = users_col.count_documents({"role": "teacher"})
    admins = users_col.count_documents({"role": "admin"})
    total_doubts = doubts_col.count_documents({})
    feedback_docs = list(doubts_col.find({"feedback": {"$ne": None}}))
    total_feedback = len(feedback_docs)

    avg_rating = "5.0"
    if total_feedback > 0:
        total_stars = sum(d.get("feedback", {}).get("rating", 5) for d in feedback_docs)
        avg_rating = f"{(total_stars / total_feedback):.1f}"

    subjects_count = subjects_col.count_documents({})

    return jsonify({
        "total_users": total_users,
        "students_count": students,
        "teachers_count": teachers,
        "admins_count": admins,
        "total_doubts": total_doubts,
        "total_feedback": total_feedback,
        "avg_rating": avg_rating,
        "subjects_count": subjects_count
    })

@admin_bp.route("/api/admin/users", methods=["GET"])
def admin_get_users():
    users = list(users_col.find({}, {"password": 0}))
    return jsonify(clean_doc(users))

@admin_bp.route("/api/admin/users", methods=["POST"])
def admin_create_user():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "changeme123")
    role = data.get("role", "student")
    subject = data.get("subject", "General")
    grade = data.get("grade", "General")

    if not name or not email:
        return jsonify({"error": "Name and email are required"}), 400

    if users_col.find_one({"email": email}):
        return jsonify({"error": "A user with this email already exists"}), 409

    user_id = f"u-{uuid.uuid4().hex[:8]}"
    new_user = {
        "id": user_id,
        "name": name,
        "email": email,
        "password": password,
        "role": role if role in ["student", "teacher", "admin"] else "student",
        "subject": subject if role == "teacher" else None,
        "grade": grade if role == "student" else None,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    users_col.insert_one(new_user)
    clean_u = clean_doc(new_user)
    clean_u.pop("password", None)
    return jsonify(clean_u), 201

@admin_bp.route("/api/admin/teachers", methods=["GET"])
def admin_get_teachers():
    teachers = list(users_col.find({"role": "teacher"}, {"password": 0}))
    result = []
    for t in teachers:
        name = t.get("name", "")
        uid = t.get("id", "")
        rev_count = doubts_col.count_documents({
            "$or": [
                {"teacher_review.teacher_name": name},
                {"teacher_review.teacher_id": uid}
            ]
        })
        doc = clean_doc(t)
        doc["explanations_count"] = rev_count
        result.append(doc)
    return jsonify(result)

@admin_bp.route("/api/admin/teachers", methods=["POST"])
def admin_create_teacher():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "teacher123")
    subject = data.get("subject", "General")

    if not name or not email:
        return jsonify({"error": "Teacher name and email are required"}), 400

    if users_col.find_one({"email": email}):
        return jsonify({"error": "An account with this email already exists"}), 409

    teacher_id = f"u-teacher-{uuid.uuid4().hex[:6]}"
    new_teacher = {
        "id": teacher_id,
        "name": name,
        "email": email,
        "password": password,
        "role": "teacher",
        "subject": subject,
        "grade": None,
        "status": "active",
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    users_col.insert_one(new_teacher)
    clean_t = clean_doc(new_teacher)
    clean_t.pop("password", None)
    clean_t["explanations_count"] = 0
    return jsonify(clean_t), 201

@admin_bp.route("/api/admin/teachers/<teacher_id>", methods=["PUT"])
def admin_update_teacher(teacher_id):
    data = request.get_json() or {}
    fields = {}
    if "name" in data and data["name"].strip():
        fields["name"] = data["name"].strip()
    if "email" in data and data["email"].strip():
        fields["email"] = data["email"].strip().lower()
    if "subject" in data and data["subject"].strip():
        fields["subject"] = data["subject"].strip()
    if "password" in data and data["password"].strip():
        fields["password"] = data["password"].strip()
    if "status" in data:
        fields["status"] = data["status"]

    if fields:
        users_col.update_one({"id": teacher_id, "role": "teacher"}, {"$set": fields})

    updated = users_col.find_one({"id": teacher_id}, {"password": 0})
    if not updated:
        return jsonify({"error": "Teacher not found"}), 404
    return jsonify(clean_doc(updated))

@admin_bp.route("/api/admin/teachers/<teacher_id>", methods=["DELETE"])
def admin_delete_teacher(teacher_id):
    res = users_col.delete_one({"id": teacher_id, "role": "teacher"})
    if res.deleted_count == 0:
        return jsonify({"error": "Teacher not found"}), 404
    return jsonify({"message": "Teacher account removed successfully"})

@admin_bp.route("/api/admin/activity", methods=["GET"])
def admin_get_activity():
    activities = []
    for d in doubts_col.find().sort("created_at", -1).limit(20):
        u_name = d.get("user_name", "Student")
        if u_name == "Alex Rivera":
            u_name = "Student"
        activities.append({
            "id": f"act-{d.get('id')}",
            "type": "doubt",
            "user_name": u_name,
            "action": "submitted a doubt",
            "target": d.get("title") or d.get("subject", "General"),
            "subject": d.get("subject", "General"),
            "status": d.get("status", "pending"),
            "timestamp": d.get("created_at", datetime.utcnow().isoformat())
        })
        tr = d.get("teacher_review")
        if tr and tr.get("reviewed_at"):
            t_name = tr.get("teacher_name", "Teacher")
            if t_name == "Alex Rivera":
                t_name = "Teacher"
            activities.append({
                "id": f"act-rev-{d.get('id')}",
                "type": "review",
                "user_name": t_name,
                "action": "provided explanation for",
                "target": d.get("title") or d.get("subject", "General"),
                "subject": d.get("subject", "General"),
                "status": tr.get("action", "verified"),
                "timestamp": tr.get("reviewed_at", d.get("created_at"))
            })
    for q in quizzes_col.find().sort("created_at", -1).limit(10):
        score_data = q.get("score")
        if isinstance(score_data, dict):
            correct = score_data.get("correct", 0)
            total = score_data.get("total", q.get("question_count", 0))
            pct = score_data.get("percentage", int((correct / total * 100) if total else 0))
            action_text = f"{correct}/{total} correct({pct}%)"
        elif score_data is not None:
            total = q.get("question_count") or q.get("total_questions") or 0
            pct = int((score_data / total * 100) if total else 0)
            action_text = f"{score_data}/{total} correct({pct}%)" if total else f"{score_data} correct"
        else:
            action_text = "quiz in progress"

        quiz_target = q.get("topic") or q.get("subject", "General")
        u_name = q.get("user_name", "Student")
        if u_name == "Alex Rivera":
            u_name = "Student"
        activities.append({
            "id": f"act-quiz-{q.get('id')}",
            "type": "quiz",
            "user_name": u_name,
            "action": action_text,
            "target": f"Quiz: {quiz_target}" if not quiz_target.lower().startswith("quiz") else quiz_target,
            "subject": q.get("subject", "General"),
            "status": "completed" if q.get("status") == "Completed" else "in progress",
            "timestamp": q.get("completed_at") or q.get("created_at", datetime.utcnow().isoformat())
        })
    for u in users_col.find().sort("created_at", -1).limit(10):
        if u.get("created_at"):
            u_name = u.get("name", "User")
            if u_name == "Alex Rivera":
                continue
            activities.append({
                "id": f"act-user-{u.get('id')}",
                "type": "user",
                "user_name": u_name,
                "action": f"registered as {u.get('role', 'student').title()}",
                "target": u.get("email", ""),
                "subject": u.get("role", "student"),
                "status": "active",
                "timestamp": u.get("created_at")
            })
    activities.sort(key=lambda x: str(x.get("timestamp", "")), reverse=True)
    return jsonify(activities[:30])

@admin_bp.route("/api/admin/feedback", methods=["GET"])
def admin_get_feedback():
    doubts = list(doubts_col.find({"feedback": {"$ne": None}}).sort("created_at", -1))
    feedback_list = []
    for d in doubts:
        fb = d.get("feedback") or {}
        u_name = d.get("user_name", "Student")
        if u_name == "Alex Rivera":
            u_name = "Student"
        feedback_list.append({
            "id": d.get("id"),
            "user_id": d.get("user_id"),
            "user_name": u_name,
            "subject": d.get("subject", "General"),
            "title": d.get("title", "Question"),
            "rating": fb.get("rating", 5),
            "helpful": fb.get("helpful", True),
            "comment": fb.get("comment", ""),
            "created_at": d.get("created_at", "")
        })
    return jsonify(feedback_list)

@admin_bp.route("/api/admin/users/<user_id>", methods=["PUT"])
def admin_update_user(user_id):
    data = request.get_json() or {}
    fields = {}
    for key in ["name", "email", "role", "subject", "grade"]:
        if key in data:
            fields[key] = data[key]

    if fields:
        users_col.update_one({"id": user_id}, {"$set": fields})

    updated = users_col.find_one({"id": user_id}, {"password": 0})
    return jsonify(clean_doc(updated))

@admin_bp.route("/api/admin/users/<user_id>", methods=["DELETE"])
def admin_delete_user(user_id):
    if user_id == "u-admin-1":
        return jsonify({"error": "Primary administrator account cannot be deleted"}), 403

    res = users_col.delete_one({"id": user_id})
    if res.deleted_count == 0:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"message": "User deleted successfully"})

@admin_bp.route("/api/admin/settings", methods=["GET"])
def admin_get_settings():
    doc = settings_col.find_one({"id": "global_settings"}) or {}
    api_key = doc.get("grok_api_key", "")
    return jsonify({
        "has_api_key": bool(api_key),
        "grok_api_key": f"sk-...{api_key[-4:]}" if api_key else "",
        "grok_model": doc.get("grok_model", "grok-2-latest"),
        "system_prompt": doc.get("system_prompt", ""),
        "default_explanation_level": doc.get("default_explanation_level", "intermediate")
    })

@admin_bp.route("/api/admin/settings", methods=["POST"])
def admin_update_settings():
    data = request.get_json() or {}
    fields = {}
    if "grok_api_key" in data and not data["grok_api_key"].startswith("sk-..."):
        fields["grok_api_key"] = data["grok_api_key"].strip()
    if "grok_model" in data:
        fields["grok_model"] = data["grok_model"].strip()
    if "system_prompt" in data:
        fields["system_prompt"] = data["system_prompt"].strip()
    if "default_explanation_level" in data:
        fields["default_explanation_level"] = data["default_explanation_level"].strip()

    if fields:
        settings_col.update_one({"id": "global_settings"}, {"$set": fields}, upsert=True)

    return jsonify({"message": "Settings updated successfully"})

@admin_bp.route("/api/admin/subjects", methods=["GET"])
@admin_bp.route("/api/subjects", methods=["GET"])
def get_subjects():
    docs = list(subjects_col.find())
    return jsonify(clean_doc(docs))

@admin_bp.route("/api/admin/subjects", methods=["POST"])
def add_subject():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Subject name required"}), 400

    if subjects_col.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}}):
        return jsonify({"error": "Subject already exists"}), 409

    sub_doc = {
        "id": f"sub-{uuid.uuid4().hex[:6]}",
        "name": name,
        "icon": data.get("icon", "book"),
        "color": data.get("color", "blue"),
        "description": data.get("description", "")
    }
    subjects_col.insert_one(sub_doc)
    notifications_col.insert_one({
        "id": f"n-{uuid.uuid4().hex[:8]}",
        "role_target": "all",
        "title": "New Subject Added",
        "message": f"Curriculum subject '{name}' is now active across learning modules.",
        "read": False,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "link": "/ask"
    })
    trigger_desktop_notification("New Subject Added", f"Curriculum subject '{name}' is now active.")
    return jsonify(clean_doc(sub_doc)), 201

@admin_bp.route("/api/admin/subjects/<sub_id>", methods=["DELETE"])
def delete_subject(sub_id):
    from bson.objectid import ObjectId
    flt = {"id": sub_id}
    if ObjectId.is_valid(sub_id):
        flt = {"$or": [{"id": sub_id}, {"_id": ObjectId(sub_id)}]}
    subjects_col.delete_one(flt)
    return jsonify({"message": "Subject removed"})
