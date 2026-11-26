import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from db import clean_doc, users_col
from routes.helpers import trigger_desktop_notification

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/auth/google", methods=["POST"])
def auth_google():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    name = data.get("name", "").strip() or (email.split("@")[0] if email else "Google User")
    photo_url = data.get("photo_url", "")
    firebase_uid = data.get("firebase_uid", "")
    role = data.get("role", "student")
    if role not in ["student", "teacher", "admin"]:
        role = "student"

    if not email:
        return jsonify({"error": "Google email is required"}), 400

    user = users_col.find_one({"$or": [{"email": email}, {"name": data.get("email", "").strip()}]})
    if not user:
        user_id = f"u-{uuid.uuid4().hex[:8]}"
        user = {
            "id": user_id,
            "name": name,
            "email": email,
            "role": role,
            "photo_url": photo_url,
            "firebase_uid": firebase_uid,
            "auth_provider": "google",
            "subject": None,
            "grade": "General" if role == "student" else None,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        users_col.insert_one(user)
    else:
        update_fields = {}
        if photo_url and not user.get("photo_url"):
            update_fields["photo_url"] = photo_url
        if firebase_uid and not user.get("firebase_uid"):
            update_fields["firebase_uid"] = firebase_uid
        if not user.get("auth_provider"):
            update_fields["auth_provider"] = "google"
        if update_fields:
            users_col.update_one({"_id": user["_id"]}, {"$set": update_fields})
            user.update(update_fields)

    clean_user = clean_doc(user)
    clean_user.pop("password", None)
    token = f"token-{clean_user['id']}-{int(datetime.utcnow().timestamp())}"
    return jsonify({"user": clean_user, "token": token})

@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = users_col.find_one({"$or": [{"email": email}, {"name": data.get("email", "").strip()}]})
    if not user or user.get("password") != password:
        return jsonify({"error": "Invalid email or password"}), 401

    clean_user = clean_doc(user)
    clean_user.pop("password", None)
    token = f"token-{clean_user['id']}-{int(datetime.utcnow().timestamp())}"
    return jsonify({"user": clean_user, "token": token})

@auth_bp.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    role = data.get("role", "student")
    subject = data.get("subject", "General")
    grade = data.get("grade", "General")

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400

    if users_col.find_one({"email": email}):
        return jsonify({"error": "An account with this email already exists"}), 409

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
    clean_user = clean_doc(new_user)
    clean_user.pop("password", None)
    token = f"token-{user_id}-{int(datetime.utcnow().timestamp())}"
    return jsonify({"user": clean_user, "token": token}), 201

@auth_bp.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    new_password = data.get("new_password", "")

    if not email or not new_password:
        return jsonify({"error": "Email and new password are required"}), 400

    user = users_col.find_one({"$or": [{"email": email}, {"name": data.get("email", "").strip()}]})
    if not user:
        return jsonify({"error": "No account found with this email"}), 404

    users_col.update_one({"email": email}, {"$set": {"password": new_password}})
    return jsonify({"message": "Password updated successfully. You can now login."})

@auth_bp.route("/api/auth/me", methods=["GET"])
def me():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if not token:
        return jsonify({"error": "Unauthorized"}), 401

    parts = token.split("-")
    user_id = f"{parts[1]}-{parts[2]}" if len(parts) >= 3 else None
    user = users_col.find_one({"id": user_id}) if user_id else None
    if not user:
        return jsonify({"error": "User session expired or invalid"}), 401

    clean_user = clean_doc(user)
    clean_user.pop("password", None)
    return jsonify({"user": clean_user})
