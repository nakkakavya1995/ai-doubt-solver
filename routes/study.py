from flask import Blueprint, request, jsonify
from db import doubts_col

study_bp = Blueprint("study", __name__)

def build_study_recommendations(user_id=None):
    query = {}
    if user_id:
        query = {"$or": [{"user_id": user_id}, {"user_id": {"$exists": False}}]}
    user_doubts = list(doubts_col.find(query).sort("created_at", -1))

    templates = {
        "Mathematics": {
            "topic": "Trigonometric Limits & Squeeze Theorem",
            "reason": "Derived from your calculus limits doubts. Understanding how multi-coefficient angles balance (lim sin(kx)/x = k) and indeterminate forms (0/0) accelerates advanced calculus mastery.",
            "exercises": [
                {
                    "title": "Trig Limit Transformation Drill",
                    "type": "Practice Problems",
                    "difficulty": "Medium",
                    "count": "3 Problems",
                    "description": "Evaluate multi-coefficient expressions like lim_{x->0} (sin kx)/x and (1 - cos x)/x^2."
                },
                {
                    "title": "Calculus Continuity Assessment",
                    "type": "Adaptive Quiz",
                    "difficulty": "Hard",
                    "count": "5 Questions",
                    "description": "Assess conceptual understanding of epsilon-delta bounds and piecewise continuity."
                }
            ],
            "learning_resources": [
                {
                    "title": "Essential Calculus Limit Invariants Sheet",
                    "type": "Formula Guide",
                    "summary": "Key formulas:\n$$\\lim_{u \\to 0} \\frac{\\sin u}{u} = 1$$\n$$\\lim_{u \\to 0} \\frac{\\tan u}{u} = 1$$\n$$\\lim_{u \\to 0} \\frac{1 - \\cos u}{u^2} = \\frac{1}{2}$$\nAlways balance angle multipliers before applying standard limit theorems."
                },
                {
                    "title": "Squeeze (Sandwich) Theorem Reference",
                    "type": "Theorem Summary",
                    "summary": "If $g(x) \\le f(x) \\le h(x)$ for all $x$ in an open interval containing $c$ (except possibly at $c$) and:\n$$\\lim_{x \\to c} g(x) = \\lim_{x \\to c} h(x) = L$$\nthen $\\lim_{x \\to c} f(x) = L$. Used to evaluate oscillating functions bounded by convergent polynomials."
                }
            ]
        },
        "Physics": {
            "topic": "Work-Energy Theorem & Conservation Laws",
            "reason": "Derived from your work-energy and kinetic energy doubts. Connecting net work W_net = Delta K with conservative potential fields Delta U provides a universal framework for mechanics.",
            "exercises": [
                {
                    "title": "Incline & Friction Force Problem Set",
                    "type": "Practice Problems",
                    "difficulty": "Medium",
                    "count": "3 Problems",
                    "description": "Calculate work done against kinetic friction and determine terminal velocity at incline bases."
                },
                {
                    "title": "Work, Energy & Momentum Quiz",
                    "type": "Adaptive Quiz",
                    "difficulty": "Medium",
                    "count": "5 Questions",
                    "description": "Test distinctions between conservative vs non-conservative forces and power output."
                }
            ],
            "learning_resources": [
                {
                    "title": "Work-Energy Theorem & Conservation Reference",
                    "type": "Formula Guide",
                    "summary": "Key formulas:\n$$W_{net} = \\Delta K = \\frac{1}{2} m v_f^2 - \\frac{1}{2} m v_i^2$$\nWhen only conservative forces act:\n$$\\Delta K + \\Delta U = 0$$\nWork done by non-conservative forces (friction):\n$$W_{nc} = \\Delta E_{mechanical}$$"
                },
                {
                    "title": "Kinetic Energy Derivation from First Principles",
                    "type": "Derivation Sheet",
                    "summary": "From Newton's second law $F = m \\frac{dv}{dt}$ and work $W = \\int F dx = \\int m \\frac{dv}{dt} dx = \\int m v dv = \\frac{1}{2} m v^2$. Confirms quadratic scaling with speed."
                }
            ]
        },
        "Computer Science": {
            "topic": "Loop Invariants & Algorithmic Interval Convergence",
            "reason": "Derived from your programming loop and binary search doubts. Establishing strict termination criteria and interval reductions eliminates infinite loops and boundary exceptions.",
            "exercises": [
                {
                    "title": "Binary Search Boundary Debugging Drill",
                    "type": "Practice Problems",
                    "difficulty": "Medium",
                    "count": "3 Problems",
                    "description": "Verify mid index calculation (low + (high - low) // 2) and termination criteria."
                },
                {
                    "title": "Algorithms & Control Flow Quiz",
                    "type": "Adaptive Quiz",
                    "difficulty": "Easy",
                    "count": "5 Questions",
                    "description": "Identify loop invariants, time complexities (O(log n)), and recursion base cases."
                }
            ],
            "learning_resources": [
                {
                    "title": "Algorithmic Loop Invariants Cheatsheet",
                    "type": "Code Guide",
                    "summary": "Strict Invariant Rule: Every iteration must strictly diminish the active search interval (high = mid - 1, low = mid + 1). Use 'while low <= high' when searching single values to avoid off-by-one errors."
                },
                {
                    "title": "Polymorphism & OOP Design Patterns",
                    "type": "Reference Guide",
                    "summary": "Polymorphism allows one unified interface to control distinct underlying forms (data types or classes). Enables dynamic method dispatch and flexible, decoupled software architecture."
                }
            ]
        },
        "Chemistry": {
            "topic": "Dynamic Equilibrium & Le Chatelier Principle",
            "reason": "Derived from chemical reaction inquiries. Connecting reaction quotients Q with equilibrium constants K_eq allows accurate prediction of system shifts under stress.",
            "exercises": [
                {
                    "title": "Le Chatelier Principle Stress Drills",
                    "type": "Practice Problems",
                    "difficulty": "Simplified",
                    "count": "3 Problems",
                    "description": "Predict direction of equilibrium shifts when temperature, pressure, or volume changes."
                },
                {
                    "title": "Equilibrium Constant Calculation Quiz",
                    "type": "Adaptive Quiz",
                    "difficulty": "Medium",
                    "count": "5 Questions",
                    "description": "Calculate K_c and K_p given initial and equilibrium molar concentrations."
                }
            ],
            "learning_resources": [
                {
                    "title": "Le Chatelier & Equilibrium Laws Summary",
                    "type": "Formula Guide",
                    "summary": "Key equilibrium formula:\n$$K_{eq} = \\frac{[C]^c [D]^d}{[A]^a [B]^b}$$\nIf $Q < K$, the forward reaction is favored. If $Q > K$, reverse reaction dominates. Endothermic reactions shift right when heated."
                }
            ]
        }
    }

    recs = []
    seen_subjects = set()

    for d in user_doubts:
        subj = d.get("subject", "Mathematics")
        title = d.get("title", "")
        if subj in templates and subj not in seen_subjects:
            seen_subjects.add(subj)
            item = templates[subj]
            recs.append({
                "id": f"rec-{len(recs)+1}",
                "doubt_id": str(d.get("id") or d.get("_id")),
                "doubt_title": title,
                "subject": subj,
                "recommended_topic": item["topic"],
                "topic": item["topic"],
                "reason": f"Based on your solved doubt '{title}': {item['reason']}",
                "recommended_action": f"Practice {item['topic']}",
                "exercises": item["exercises"],
                "learning_resources": item["learning_resources"],
                "difficulty": "intermediate",
                "estimated_minutes": 10
            })

    for subj, item in templates.items():
        if subj not in seen_subjects:
            recs.append({
                "id": f"rec-{len(recs)+1}",
                "doubt_id": None,
                "doubt_title": f"Foundational curriculum in {subj}",
                "subject": subj,
                "recommended_topic": item["topic"],
                "topic": item["topic"],
                "reason": item["reason"],
                "recommended_action": f"Practice {item['topic']}",
                "exercises": item["exercises"],
                "learning_resources": item["learning_resources"],
                "difficulty": "intermediate",
                "estimated_minutes": 10
            })

    return recs

@study_bp.route("/api/study-recommendations", methods=["GET"])
def get_study_recommendations():
    user_id = request.args.get("user_id")
    recs = build_study_recommendations(user_id)
    return jsonify({
        "recommendations": recs,
        "total_doubts_solved": len(recs)
    })

@study_bp.route("/api/quiz/recommendations", methods=["GET"])
def get_recommendations():
    user_id = request.args.get("user_id")
    recs = build_study_recommendations(user_id)
    return jsonify({
        "recommendations": recs,
        "total_doubts_solved": len(recs)
    })

