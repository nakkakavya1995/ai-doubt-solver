import uuid
import json
import time
from datetime import datetime
from flask import Blueprint, request, jsonify, Response
from bson import ObjectId
from db import clean_doc, notifications_col
from routes.helpers import trigger_desktop_notification

notifications_bp = Blueprint("notifications", __name__)

def get_notif_query(user_id, role):
    clauses = []
    if user_id:
        clauses.append({"user_id": user_id})
    if role:
        clauses.append({"role_target": role})
    clauses.append({"role_target": "all"})
    if clauses:
        return {"$or": clauses}
    return {}

@notifications_bp.route("/api/notifications", methods=["GET"])
def get_notifications():
    try:
        user_id = request.args.get("user_id")
        role = request.args.get("role")
        query = get_notif_query(user_id, role)
        docs = list(notifications_col.find(query).sort("timestamp", -1).limit(30))
        result = clean_doc(docs)
        return jsonify(result if result is not None else [])
    except Exception:
        return jsonify([])

@notifications_bp.route("/api/notifications/stream", methods=["GET"])
def stream_notifications():
    user_id = request.args.get("user_id")
    role = request.args.get("role")
    query = get_notif_query(user_id, role)

    def event_generator():
        yield "retry: 2000\n\n"
        start_time = datetime.utcnow().isoformat() + "Z"
        seen_ids = set()
        for doc in notifications_col.find(query).sort("timestamp", -1).limit(5):
            nid = doc.get("id")
            if nid:
                seen_ids.add(nid)
                if not doc.get("read", False):
                    yield f"event: notification\ndata: {json.dumps(clean_doc(doc))}\n\n"

        for _ in range(3):
            time.sleep(1.0)
            try:
                recent = list(notifications_col.find({
                    **query,
                    "timestamp": {"$gte": start_time}
                }).sort("timestamp", -1).limit(5))
                for doc in recent:
                    nid = doc.get("id")
                    if nid and nid not in seen_ids:
                        seen_ids.add(nid)
                        yield f"event: notification\ndata: {json.dumps(clean_doc(doc))}\n\n"
            except Exception:
                pass
            yield ": ping\n\n"

    resp = Response(event_generator(), mimetype="text/event-stream")
    resp.headers["Cache-Control"] = "no-cache"
    resp.headers["X-Accel-Buffering"] = "no"
    resp.headers["Connection"] = "keep-alive"
    return resp

@notifications_bp.route("/api/notifications/<nid>/read", methods=["POST"])
def mark_notification_read(nid):
    notifications_col.update_one({"id": nid}, {"$set": {"read": True}})
    return jsonify({"success": True, "message": "Marked read"})

@notifications_bp.route("/api/notifications/clear-all", methods=["POST"])
def clear_all_notifications():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    role = data.get("role")
    query = get_notif_query(user_id, role)
    notifications_col.update_many(query, {"$set": {"read": True}})
    return jsonify({"success": True, "message": "Cleared"})

@notifications_bp.route("/api/notifications/test-desktop", methods=["POST"])
def test_desktop_notification():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    role = data.get("role")
    title = data.get("title", "AI Doubt Solver Alert")
    message = data.get("message", "Real-time notifications active for learning activities and updates.")
    doc = {
        "id": f"n-{uuid.uuid4().hex[:8]}",
        "user_id": user_id,
        "role_target": role if not user_id else None,
        "title": title,
        "message": message,
        "read": False,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "link": "/"
    }
    notifications_col.insert_one(doc)
    trigger_desktop_notification(title, message)
    return jsonify({"success": True, "notification": clean_doc(doc)})
