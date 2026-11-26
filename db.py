import os
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000, connectTimeoutMS=2000, socketTimeoutMS=2000)
db = client["doubt_solver_db"]

users_col = db["users"]
doubts_col = db["doubts"]
subjects_col = db["subjects"]
notifications_col = db["notifications"]
settings_col = db["settings"]
quizzes_col = db["quizzes"]

def clean_doc(doc):
    if doc is None:
        return None
    if isinstance(doc, list):
        return [clean_doc(item) for item in doc]
    d = dict(doc)
    if "_id" in d:
        if "id" not in d:
            d["id"] = str(d["_id"])
        del d["_id"]
    return d

def init_db():
    if users_col.count_documents({}) == 0:
        users_col.insert_many([
            {
                "id": "u-admin-1",
                "name": "System Administrator",
                "email": "admin@doubtsolver.com",
                "password": "AdminPass@123",
                "role": "admin",
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "u-teacher-1",
                "name": "Prof. Sarah Jenkins",
                "email": "teacher@doubtsolver.com",
                "password": "TeacherPass@123",
                "role": "teacher",
                "subject": "Mathematics",
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "u-student-1",
                "name": "Alex Rivera",
                "email": "student@doubtsolver.com",
                "password": "StudentPass@123",
                "role": "student",
                "grade": "12th Grade",
                "created_at": datetime.utcnow().isoformat()
            }
        ])

    if subjects_col.count_documents({}) == 0:
        subjects_col.insert_many([
            {"id": "sub-1", "name": "Mathematics", "icon": "calculator", "color": "blue", "description": "Calculus, Algebra, Geometry, Trigonometry"},
            {"id": "sub-2", "name": "Physics", "icon": "zap", "color": "amber", "description": "Mechanics, Thermodynamics, Electromagnetism"},
            {"id": "sub-3", "name": "Chemistry", "icon": "flask", "color": "emerald", "description": "Organic, Inorganic, Physical Chemistry"},
            {"id": "sub-4", "name": "Computer Science", "icon": "code", "color": "violet", "description": "Algorithms, Data Structures, Python, C++"},
            {"id": "sub-5", "name": "English", "icon": "book", "color": "rose", "description": "Grammar, Literature, Reading Comprehension"},
            {"id": "sub-6", "name": "Biology", "icon": "dna", "color": "teal", "description": "Genetics, Physiology, Cell Biology"}
        ])

    if doubts_col.count_documents({}) == 0:
        doubts_col.insert_many([
            {
                "id": "d-101",
                "user_id": "u-student-1",
                "user_name": "Alex Rivera",
                "title": "Evaluate the limit of (sin 3x) / x as x approaches 0",
                "question": "How do I evaluate the limit lim_{x -> 0} (sin 3x)/x without using L'Hopital's rule?",
                "subject": "Mathematics",
                "explanation_level": "intermediate",
                "type": "text",
                "status": "verified",
                "bookmarked": True,
                "solution": {
                    "summary": "Use the fundamental trigonometric limit lim_{u -> 0} (sin u)/u = 1 by substituting u = 3x.",
                    "steps": [
                        {
                            "step_number": 1,
                            "title": "Recall Fundamental Limit Formula",
                            "content": "Recall the fundamental calculus limit: \\lim_{u \\to 0} \\frac{\\sin u}{u} = 1."
                        },
                        {
                            "step_number": 2,
                            "title": "Multiply and Balance Coefficients",
                            "content": "Multiply both the numerator and denominator by 3 so the denominator matches the inner angle 3x:\n$$\\lim_{x \\to 0} \\frac{\\sin(3x)}{x} = \\lim_{x \\to 0} 3 \\cdot \\frac{\\sin(3x)}{3x}$$"
                        },
                        {
                            "step_number": 3,
                            "title": "Evaluate with Substitution",
                            "content": "Let $u = 3x$. As $x \\to 0$, $u \\to 0$. We obtain:\n$$3 \\cdot \\lim_{u \\to 0} \\frac{\\sin u}{u} = 3 \\cdot 1 = 3$$"
                        }
                    ],
                    "final_answer": "The limit is 3.",
                    "key_takeaway": "For any constant k, lim_{x -> 0} sin(kx)/x = k."
                },
                "follow_ups": [
                    {
                        "id": "f-1",
                        "sender": "student",
                        "text": "What happens if the denominator is x squared instead?",
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    {
                        "id": "f-2",
                        "sender": "ai",
                        "text": "If the expression is (sin 3x)/x^2, it decomposes to [(sin 3x)/x] * [1/x] -> 3 * (1/x). Since 1/x diverges to infinity from the right and negative infinity from the left, the two-sided limit does not exist.",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                ],
                "feedback": {
                    "rating": 5,
                    "comment": "Very clear and easy to follow!",
                    "helpful": True,
                    "report_issue": False
                },
                "teacher_review": {
                    "reviewed": True,
                    "teacher_name": "Prof. Sarah Jenkins",
                    "note": "Verified by instructor. Substitution is the standard recommended exam method."
                },
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "d-102",
                "user_id": "u-student-1",
                "user_name": "Alex Rivera",
                "title": "Binary search infinite loop error in Python",
                "question": "My binary search function gets stuck in an infinite loop when the target does not exist. Where is the bug?",
                "subject": "Computer Science",
                "explanation_level": "detailed",
                "type": "code",
                "code_snippet": "def binary_search(arr, target):\n    low = 0\n    high = len(arr)\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid\n        else:\n            high = mid\n    return -1",
                "code_language": "python",
                "status": "solved",
                "bookmarked": False,
                "solution": {
                    "summary": "The pointers fail to strictly shrink the search range when low + 1 == high, and initial high should be len(arr) - 1.",
                    "steps": [
                        {
                            "step_number": 1,
                            "title": "Index Boundary Correction",
                            "content": "Initial high is len(arr). When low and high meet at index len(arr), arr[mid] raises an IndexError. Initialize high to len(arr) - 1."
                        },
                        {
                            "step_number": 2,
                            "title": "Eliminate Stagnant Pointers",
                            "content": "Setting low = mid or high = mid leads to an infinite cycle because integer division rounds down. Update low = mid + 1 and high = mid - 1."
                        }
                    ],
                    "code_correction": "def binary_search(arr, target):\n    low = 0\n    high = len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1",
                    "final_answer": "Use low = mid + 1 and high = mid - 1 with initial high = len(arr) - 1.",
                    "key_takeaway": "Every iteration in binary search must guarantee a strict reduction of the active subarray interval."
                },
                "follow_ups": [],
                "feedback": {
                    "rating": 5,
                    "comment": "Fixed the issue immediately.",
                    "helpful": True
                },
                "teacher_review": None,
                "created_at": datetime.utcnow().isoformat()
            }
        ])

    if notifications_col.count_documents({}) == 0:
        notifications_col.insert_many([
            {
                "id": "n-1",
                "user_id": "u-student-1",
                "title": "Teacher Solution Verified",
                "message": "Prof. Sarah Jenkins reviewed and approved your calculus limit doubt.",
                "read": False,
                "timestamp": datetime.utcnow().isoformat(),
                "link": "d-101"
            },
            {
                "id": "n-2",
                "user_id": "u-student-1",
                "title": "Practice Quiz Available",
                "message": "Take a 5-question quick quiz on limits to reinforce understanding.",
                "read": True,
                "timestamp": datetime.utcnow().isoformat(),
                "link": "quiz"
            }
        ])

    if settings_col.count_documents({}) == 0:
        settings_col.insert_one({
            "id": "global_settings",
            "grok_api_key": os.getenv("GROK_API_KEY", os.getenv("XAI_API_KEY", "")),
            "grok_model": "grok-2-latest",
            "system_prompt": "You are a world-class academic tutor. Deliver clear, verified, step-by-step explanations.",
            "default_explanation_level": "intermediate"
        })

    if quizzes_col.count_documents({}) == 0:
        quizzes_col.insert_many([
            {
                "id": "quiz-init-1",
                "user_id": "u-student-1",
                "user_name": "Alex Rivera",
                "topic": "Work Energy Theorem",
                "subject": "Physics",
                "difficulty": "Medium",
                "question_count": 3,
                "questions": [
                    {
                        "id": 1,
                        "question": "Which statement correctly represents the Work-Energy Theorem for a net external force acting on a point mass?",
                        "options": [
                            "W_net = Delta K (Change in Kinetic Energy)",
                            "W_net = Delta U (Change in Potential Energy)",
                            "W_net = K_initial + K_final",
                            "W_net = 0 at all times"
                        ],
                        "correct_index": 0,
                        "explanation": "The work-energy theorem states that net work done by all forces equals the change in the object's kinetic energy: W_net = Delta K."
                    },
                    {
                        "id": 2,
                        "question": "If the net work done on an object is positive, what happens to its kinetic energy?",
                        "options": [
                            "Its kinetic energy decreases",
                            "Its kinetic energy increases",
                            "Its kinetic energy remains zero",
                            "Its speed drops to half"
                        ],
                        "correct_index": 1,
                        "explanation": "Since W_net = K_f - K_i, positive net work implies K_f > K_i, meaning kinetic energy increases."
                    },
                    {
                        "id": 3,
                        "question": "A 2 kg mass accelerates from rest to 4 m/s. What is the total work done on the object?",
                        "options": [
                            "8 Joules",
                            "16 Joules",
                            "32 Joules",
                            "4 Joules"
                        ],
                        "correct_index": 1,
                        "explanation": "W_net = 1/2 m v_f^2 - 1/2 m v_i^2 = 1/2 * 2 * (4)^2 - 0 = 16 J."
                    }
                ],
                "status": "Completed",
                "score": {
                    "correct": 3,
                    "total": 3,
                    "percentage": 100,
                    "display": "3 / 3 (100%)"
                },
                "user_answers": {"1": 0, "2": 1, "3": 1},
                "created_at": "2026-11-22T14:30:00",
                "completed_at": "2026-11-22T14:35:00"
            },
            {
                "id": "quiz-init-2",
                "user_id": "u-student-1",
                "user_name": "Alex Rivera",
                "topic": "Loops in Computer Science",
                "subject": "Computer Science",
                "difficulty": "Easy",
                "question_count": 3,
                "questions": [
                    {
                        "id": 1,
                        "question": "What is the primary function of a while loop in programming?",
                        "options": [
                            "To declare database tables",
                            "To execute code repeatedly as long as a condition evaluates to true",
                            "To compile binary executables",
                            "To format text strings"
                        ],
                        "correct_index": 1,
                        "explanation": "A while loop repeats its enclosed code block while its conditional expression remains true."
                    },
                    {
                        "id": 2,
                        "question": "What causes an infinite loop in a program?",
                        "options": [
                            "A loop condition that never becomes false",
                            "A variable that is converted to an integer",
                            "Using a descriptive variable name",
                            "Printing output to console"
                        ],
                        "correct_index": 0,
                        "explanation": "An infinite loop occurs when the loop condition is always true or its increment/termination condition is absent."
                    },
                    {
                        "id": 3,
                        "question": "In Python, which keyword immediately exits the nearest enclosing loop?",
                        "options": [
                            "continue",
                            "pass",
                            "break",
                            "return_loop"
                        ],
                        "correct_index": 2,
                        "explanation": "The break statement abruptly terminates the execution of the loop."
                    }
                ],
                "status": "Completed",
                "score": {
                    "correct": 2,
                    "total": 3,
                    "percentage": 67,
                    "display": "2 / 3 (67%)"
                },
                "user_answers": {"1": 1, "2": 0, "3": 0},
                "created_at": "2026-11-23T11:15:00",
                "completed_at": "2026-11-23T11:20:00"
            }
        ])
