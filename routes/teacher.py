import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from db import clean_doc, doubts_col, notifications_col
from routes.helpers import get_doubt_filter, trigger_desktop_notification

teacher_bp = Blueprint("teacher", __name__)

@teacher_bp.route("/api/teacher/doubts", methods=["GET"])
def teacher_all_doubts():
    subject = request.args.get("subject", "All")
    status = request.args.get("status", "All")
    search = request.args.get("search", "").strip().lower()

    query = {}
    if subject and subject != "All":
        query["subject"] = {"$regex": f"^{subject}$", "$options": "i"}
    if status == "pending":
        query["$or"] = [{"teacher_review": None}, {"teacher_review.reviewed": False}]
    elif status == "verified":
        query["teacher_review.reviewed"] = True
    elif status == "flagged":
        query["status"] = "flagged"

    docs = list(doubts_col.find(query).sort("created_at", -1))
    cleaned = clean_doc(docs)

    if search:
        cleaned = [
            d for d in cleaned
            if search in d.get("title", "").lower()
            or search in d.get("question", "").lower()
            or search in d.get("user_name", "").lower()
            or search in d.get("subject", "").lower()
        ]

    return jsonify(cleaned)

@teacher_bp.route("/api/teacher/learning-activity", methods=["GET"])
def teacher_learning_activity():
    doubts = list(doubts_col.find({}).sort("created_at", -1))

    total_doubts = len(doubts)
    verified_doubts = len([d for d in doubts if (d.get("teacher_review") or {}).get("reviewed")])
    pending_doubts = len([d for d in doubts if not (d.get("teacher_review") or {}).get("reviewed")])
    flagged_doubts = len([d for d in doubts if d.get("status") == "flagged" or (d.get("feedback") or {}).get("flagged")])

    activity_log = []
    for d in doubts[:15]:
        activity_log.append({
            "type": "doubt_submitted",
            "student_name": d.get("user_name", "Student"),
            "title": d.get("title", "Question"),
            "subject": d.get("subject", "General"),
            "status": d.get("status", "solved"),
            "timestamp": d.get("created_at", datetime.utcnow().isoformat()),
            "id": str(d.get("id") or d.get("_id"))
        })
        t_rev = d.get("teacher_review") or {}
        if t_rev.get("reviewed"):
            activity_log.append({
                "type": "teacher_explanation_added",
                "student_name": d.get("user_name", "Student"),
                "teacher_name": t_rev.get("teacher_name", "Instructor"),
                "title": d.get("title", "Question"),
                "subject": d.get("subject", "General"),
                "timestamp": t_rev.get("verified_at", d.get("created_at")),
                "id": str(d.get("id") or d.get("_id"))
            })

    activity_log.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    subject_counts = {}
    for d in doubts:
        s = d.get("subject", "Other")
        subject_counts[s] = subject_counts.get(s, 0) + 1

    subject_breakdown = []
    for s, count in subject_counts.items():
        pct = round((count / total_doubts * 100)) if total_doubts > 0 else 0
        subject_breakdown.append({
            "subject": s,
            "count": count,
            "percentage": pct
        })

    return jsonify({
        "metrics": {
            "total_doubts": total_doubts,
            "verified_doubts": verified_doubts,
            "pending_doubts": pending_doubts,
            "flagged_doubts": flagged_doubts
        },
        "activity_log": activity_log[:15],
        "subject_breakdown": subject_breakdown
    })

@teacher_bp.route("/api/teacher/pending-reviews", methods=["GET"])
def teacher_pending():
    subject = request.args.get("subject")
    query = {"$or": [{"teacher_review": None}, {"status": "flagged"}]}
    if subject and subject != "All":
        query["subject"] = {"$regex": f"^{subject}$", "$options": "i"}

    docs = list(doubts_col.find(query).sort("created_at", -1))
    return jsonify(clean_doc(docs))

@teacher_bp.route("/api/teacher/review/<doubt_id>", methods=["POST"])
def teacher_submit_review(doubt_id):
    data = request.get_json() or {}
    teacher_name = data.get("teacher_name", "Educator")
    note = data.get("note", "Verified solution by instructor.")

    doubt = doubts_col.find_one(get_doubt_filter(doubt_id))
    if not doubt:
        return jsonify({"error": "Doubt not found"}), 404

    review_data = {
        "reviewed": True,
        "teacher_name": teacher_name,
        "note": note,
        "verified_at": datetime.utcnow().isoformat() + "Z"
    }

    doubts_col.update_one(
        get_doubt_filter(doubt_id),
        {"$set": {"teacher_review": review_data, "status": "verified"}}
    )

    notifications_col.insert_one({
        "id": f"n-{uuid.uuid4().hex[:8]}",
        "user_id": doubt.get("user_id"),
        "title": "Teacher Verified Your Doubt",
        "message": f"{teacher_name} verified your solution for '{doubt.get('title')}'.",
        "read": False,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "link": doubt_id
    })
    trigger_desktop_notification("Teacher Response Added", f"{teacher_name} verified your solution for '{doubt.get('title')}'.")

    return jsonify({"message": "Review recorded successfully", "review": review_data})

@teacher_bp.route("/api/teacher/stats", methods=["GET"])
def teacher_stats():
    total = doubts_col.count_documents({})
    verified = doubts_col.count_documents({"teacher_review.reviewed": True})
    flagged = doubts_col.count_documents({"status": "flagged"})
    unreviewed = total - verified

    return jsonify({
        "total_doubts": total,
        "verified_count": verified,
        "flagged_count": flagged,
        "unreviewed_count": unreviewed
    })
