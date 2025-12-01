# app.py
#
# Minimal Flask backend for Mock Test System
# Depends on:
#   pip install flask flask-cors mysql-connector-python
#
# NOTE: This assumes you already created the MySQL tables similar to:
#   classes, teachers, students, tests, questions, results, answers
# (as we discussed before)

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from datetime import datetime

app = Flask(__name__)
# Allow React dev server
CORS(app, resources={r"/*": {"origins": "*"}})


# ---------------------- DB CONNECTION ---------------------- #

def get_db():
    """
    Returns a new DB connection.
    Adjust host/user/password/database according to your setup.
    """
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="User@123",   # 🔁 change this
        database="mock_data_db",         # 🔁 change this
        autocommit=True
    )


# ---------------------- UTILS ---------------------- #

def rows_to_dicts(cursor):
    """
    Convert cursor result to list[dict]
    """
    columns = [c[0] for c in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


# ---------------------- AUTH: /api/login ---------------------- #

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    user_type = data.get("type")      # 'teacher' or 'student'
    identifier = data.get("identifier")
    password = data.get("password")

    if not all([user_type, identifier, password]):
        return jsonify({"error": "Missing fields"}), 400

    db = get_db()
    cur = db.cursor()

    try:
        if user_type == "teacher":
            # email + password_plain in password_hash field (for demo)
            cur.execute(
                "SELECT id, name, email, password_hash FROM teachers WHERE email=%s",
                (identifier,)
            )
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Invalid credentials"}), 401

            t_id, name, email, pwd_hash = row

            # For real: compare with hashed password; demo: plain text
            if password != pwd_hash:
                return jsonify({"error": "Invalid credentials"}), 401

            return jsonify({
                "type": "teacher",
                "user": {
                    "id": t_id,
                    "name": name,
                    "email": email
                }
            })

        elif user_type == "student":
            cur.execute(
                """
                SELECT s.id, s.name, s.reg_num, s.password_hash,
                       c.id, c.department, c.year, c.section
                FROM students s
                JOIN classes c ON s.class_id = c.id
                WHERE s.reg_num = %s
                """,
                (identifier,)
            )
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Invalid credentials"}), 401

            s_id, name, reg, pwd_hash, class_id, dept, year, section = row

            if password != pwd_hash:
                return jsonify({"error": "Invalid credentials"}), 401

            return jsonify({
                "type": "student",
                "user": {
                    "id": s_id,
                    "name": name,
                    "regNum": reg,
                    "class": {
                        "id": class_id,
                        "department": dept,
                        "year": year,
                        "section": section
                    }
                }
            })

        else:
            return jsonify({"error": "Invalid user type"}), 400
    finally:
        cur.close()
        db.close()


# ---------------------- CLASSES: /api/classes ---------------------- #

@app.route("/api/classes", methods=["GET"])
def list_classes():
    """
    Returns all classes to populate teacher dropdown:
    [
      {id, department, year, section}, ...
    ]
    """
    db = get_db()
    cur = db.cursor()

    try:
        cur.execute("SELECT id, department, year, section FROM classes")
        classes = rows_to_dicts(cur)
        return jsonify(classes)
    finally:
        cur.close()
        db.close()


# ---------------------- TESTS: CREATE (TEACHER) ---------------------- #

@app.route("/api/tests", methods=["POST"])
def create_test():
    """
    Teacher creates test with questions for a specific class.

    Expects JSON:
    {
      "subject": "...",
      "scheduledDate": "2025-12-05T10:00",
      "duration": 60,
      "classId": 1,
      "teacherId": 1,
      "questions": [
        {
          "question": "...",
          "choices": ["a","b","c","d"],
          "correctAnswer": 1,
          "score": 5
        },
        ...
      ]
    }
    """
    data = request.get_json() or {}

    subject = data.get("subject")
    scheduled_date = data.get("scheduledDate")  # ISO-like string
    duration = data.get("duration")
    class_id = data.get("classId")
    teacher_id = data.get("teacherId")
    questions = data.get("questions", [])

    if not all([subject, scheduled_date, duration, class_id, teacher_id]) or not questions:
        return jsonify({"error": "Missing fields"}), 400

    db = get_db()
    cur = db.cursor()

    try:
        # Insert into tests
        cur.execute(
            """
            INSERT INTO tests
            (subject, scheduled_datetime, duration_minutes, status, class_id, created_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (subject, scheduled_date, duration, "ongoing", class_id, teacher_id)
        )
        test_id = cur.lastrowid

        # Insert questions
        for q in questions:
            cur.execute(
                """
                INSERT INTO questions
                (test_id, question_text, choice_0, choice_1, choice_2, choice_3, correct_index, score)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    test_id,
                    q.get("question", ""),
                    q.get("choices", ["", "", "", ""])[0],
                    q.get("choices", ["", "", "", ""])[1],
                    q.get("choices", ["", "", "", ""])[2],
                    q.get("choices", ["", "", "", ""])[3],
                    q.get("correctAnswer", 0),
                    q.get("score", 0),
                )
            )

        return jsonify({"message": "Test created", "testId": test_id})
    finally:
        cur.close()
        db.close()


# ---------------------- TESTS: LIST FOR TEACHER ---------------------- #

@app.route("/api/tests/teacher/<int:teacher_id>", methods=["GET"])
def get_tests_for_teacher(teacher_id):
    """
    Returns tests created by this teacher.
    Used in TeacherViewResults dropdown.
    """
    db = get_db()
    cur = db.cursor()

    try:
        cur.execute(
            """
            SELECT id, subject, scheduled_datetime, duration_minutes, status
            FROM tests
            WHERE created_by = %s
            ORDER BY scheduled_datetime DESC
            """,
            (teacher_id,)
        )
        rows = cur.fetchall()
        tests = []
        for row in rows:
            t_id, subject, sched_dt, duration, status = row
            tests.append({
                "id": t_id,
                "subject": subject,
                "scheduledDate": sched_dt.isoformat() if isinstance(sched_dt, datetime) else None,
                "duration": duration,
                "status": status,
            })
        return jsonify(tests)
    finally:
        cur.close()
        db.close()


# ---------------------- TESTS: LIST FOR STUDENT (BY CLASS) ---------- #

@app.route("/api/tests/student/<int:student_id>", methods=["GET"])
def get_tests_for_student(student_id):
    """
    Returns tests for the student's class.
    Used in StudentDashboard.
    """
    db = get_db()
    cur = db.cursor()

    try:
        # Find student's class
        cur.execute("SELECT class_id FROM students WHERE id = %s", (student_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Student not found"}), 404

        class_id = row[0]

        cur.execute(
            """
            SELECT id, subject, scheduled_datetime, duration_minutes, status
            FROM tests
            WHERE class_id = %s
            ORDER BY scheduled_datetime DESC
            """,
            (class_id,)
        )
        rows = cur.fetchall()
        tests = []
        for row in rows:
            t_id, subject, sched_dt, duration, status = row
            tests.append({
                "id": t_id,
                "subject": subject,
                "scheduledDate": sched_dt.isoformat() if isinstance(sched_dt, datetime) else None,
                "duration": duration,
                "status": status,
            })
        return jsonify(tests)
    finally:
        cur.close()
        db.close()


# ---------------------- TESTS: DETAIL + QUESTIONS ------------------- #

@app.route("/api/tests/<int:test_id>", methods=["GET"])
def get_test_detail(test_id):
    """
    Returns test info + questions.
    Used when student clicks 'Start Test'.
    """
    db = get_db()
    cur = db.cursor()

    try:
        cur.execute(
            """
            SELECT id, subject, scheduled_datetime, duration_minutes, status
            FROM tests
            WHERE id = %s
            """,
            (test_id,)
        )
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Test not found"}), 404

        t_id, subject, sched_dt, duration, status = row
        test = {
            "id": t_id,
            "subject": subject,
            "scheduledDate": sched_dt.isoformat() if isinstance(sched_dt, datetime) else None,
            "duration": duration,
            "status": status,
        }

        # Questions
        cur.execute(
            """
            SELECT id, question_text, choice_0, choice_1, choice_2, choice_3,
                   correct_index, score
            FROM questions
            WHERE test_id = %s
            """,
            (test_id,)
        )

        questions = []
        for row in cur.fetchall():
            q_id, text, c0, c1, c2, c3, correct_idx, score = row
            questions.append({
                "id": q_id,
                "question": text,
                "choices": [c0, c1, c2, c3],
                "correctAnswer": correct_idx,
                "score": score
            })

        test["questions"] = questions
        return jsonify(test)
    finally:
        cur.close()
        db.close()


# ---------------------- TESTS: SUBMIT (STUDENT) --------------------- #

@app.route("/api/tests/<int:test_id>/submit", methods=["POST"])
def submit_test(test_id):
    """
    Student submits test answers.

    Expects JSON:
    {
      "studentId": 123,
      "answers": {
        "questionId": selectedIndex,
        ...
      }
    }
    """
    data = request.get_json() or {}
    student_id = data.get("studentId")
    answers = data.get("answers", {})

    if not student_id or not answers:
        return jsonify({"error": "Missing fields"}), 400

    db = get_db()
    cur = db.cursor()

    try:
        # Fetch questions to compute score
        cur.execute(
            "SELECT id, correct_index, score FROM questions WHERE test_id = %s",
            (test_id,)
        )
        q_rows = cur.fetchall()

        total_score = 0
        earned_score = 0

        for q_id, correct_idx, score in q_rows:
            total_score += score

            # answers keys may be strings or ints
            selected = (
                answers.get(str(q_id))
                if str(q_id) in answers
                else answers.get(q_id)
            )
            if selected is not None and int(selected) == int(correct_idx):
                earned_score += score

        # Store result
        now = datetime.utcnow()
        cur.execute(
            """
            INSERT INTO results (student_id, test_id, score, total_score, submitted_at, feedback, sent)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (student_id, test_id, earned_score, total_score, now, None, 0)
        )
        result_id = cur.lastrowid

        # Store answers
        for q_id_raw, selected in answers.items():
            try:
                q_id = int(q_id_raw)
            except ValueError:
                # in case already int
                q_id = q_id_raw
            cur.execute(
                """
                INSERT INTO answers (result_id, question_id, selected_index)
                VALUES (%s, %s, %s)
                """,
                (result_id, q_id, int(selected))
            )

        return jsonify({"message": "Submitted", "score": earned_score, "totalScore": total_score})
    finally:
        cur.close()
        db.close()


# ---------------------- RESULTS: FOR A TEST (TEACHER VIEW) ---------- #

@app.route("/api/results/test/<int:test_id>", methods=["GET"])
def get_results_for_test(test_id):
    """
    Teacher sees all student results for a given test.
    """
    db = get_db()
    cur = db.cursor()

    try:
        cur.execute(
            """
            SELECT r.id, s.reg_num, s.name, r.score, r.total_score,
                   r.submitted_at, r.feedback, r.sent
            FROM results r
            JOIN students s ON r.student_id = s.id
            WHERE r.test_id = %s
            ORDER BY r.submitted_at DESC
            """,
            (test_id,)
        )
        rows = cur.fetchall()
        results = []
        for row in rows:
            r_id, reg, name, score, total, submitted_at, feedback, sent = row
            if isinstance(submitted_at, datetime):
                submitted_str = submitted_at.isoformat()
            else:
                submitted_str = None
            results.append({
                "id": r_id,
                "studentRegNum": reg,
                "studentName": name,
                "score": score,
                "totalScore": total,
                "submittedAt": submitted_str,
                "feedback": feedback,
                "sent": bool(sent),
            })
        return jsonify(results)
    finally:
        cur.close()
        db.close()


# ---------------------- RESULTS: FEEDBACK (TEACHER) ----------------- #

@app.route("/api/results/<int:result_id>/feedback", methods=["POST"])
def send_feedback(result_id):
    """
    Teacher saves/updates feedback for a student's result.

    Expects JSON:
    { "feedback": "Good job" }
    """
    data = request.get_json() or {}
    feedback = data.get("feedback", "")

    db = get_db()
    cur = db.cursor()

    try:
        cur.execute(
            "UPDATE results SET feedback = %s, sent = 1 WHERE id = %s",
            (feedback, result_id)
        )
        if cur.rowcount == 0:
            return jsonify({"error": "Result not found"}), 404
        return jsonify({"message": "Feedback updated"})
    finally:
        cur.close()
        db.close()


# ---------------------- RESULTS: FOR STUDENT ------------------------ #

@app.route("/api/results/student/<int:student_id>", methods=["GET"])
def get_results_for_student(student_id):
    """
    Student sees all their own results.
    """
    db = get_db()
    cur = db.cursor()

    try:
        cur.execute(
            """
            SELECT r.id, t.subject, r.score, r.total_score,
                   r.submitted_at, r.feedback
            FROM results r
            JOIN tests t ON r.test_id = t.id
            WHERE r.student_id = %s
            ORDER BY r.submitted_at DESC
            """,
            (student_id,)
        )
        rows = cur.fetchall()
        out = []
        for row in rows:
            r_id, subject, score, total, submitted_at, feedback = row
            submitted_str = submitted_at.isoformat() if isinstance(submitted_at, datetime) else None
            out.append({
                "id": r_id,
                "subject": subject,
                "score": score,
                "totalScore": total,
                "submittedAt": submitted_str,
                "feedback": feedback,
            })
        return jsonify(out)
    finally:
        cur.close()
        db.close()
# ---------------------- ADMIN------------------------ #


@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    db = get_db()
    cur = db.cursor()

    try:
        cur.execute(
            "SELECT id, name, email, password_hash FROM admins WHERE email = %s",
            (email,)
        )
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Invalid credentials"}), 401

        a_id, name, email, pwd_hash = row
        if password != pwd_hash:
            return jsonify({"error": "Invalid credentials"}), 401

        return jsonify({
            "id": a_id,
            "name": name,
            "email": email
        })
    finally:
        cur.close()
        db.close()







@app.route("/api/admin/classes", methods=["GET"])
def admin_list_classes():
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute("SELECT id, department, year, section FROM classes ORDER BY department, year, section")
        rows = cur.fetchall()
        classes = []
        for row in rows:
            c_id, dept, year, section = row
            classes.append({
                "id": c_id,
                "department": dept,
                "year": year,
                "section": section
            })
        return jsonify(classes)
    finally:
        cur.close()
        db.close()


@app.route("/api/admin/classes", methods=["POST"])
def admin_create_class():
    data = request.get_json() or {}
    department = data.get("department")
    year = data.get("year")
    section = data.get("section")

    if not department or not year or not section:
        return jsonify({"error": "Missing department, year or section"}), 400

    db = get_db()
    cur = db.cursor()

    try:
        cur.execute(
            "INSERT INTO classes (department, year, section) VALUES (%s, %s, %s)",
            (department, year, section)
        )
        class_id = cur.lastrowid
        return jsonify({"id": class_id, "department": department, "year": year, "section": section})
    finally:
        cur.close()
        db.close()






@app.route("/api/admin/teachers", methods=["GET"])
def admin_list_teachers():
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute("SELECT id, name, email FROM teachers ORDER BY name")
        rows = cur.fetchall()
        teachers = []
        for row in rows:
            t_id, name, email = row
            teachers.append({
                "id": t_id,
                "name": name,
                "email": email
            })
        return jsonify(teachers)
    finally:
        cur.close()
        db.close()


@app.route("/api/admin/teachers", methods=["POST"])
def admin_create_teacher():
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "Missing name, email or password"}), 400

    db = get_db()
    cur = db.cursor()

    try:
        cur.execute(
            "INSERT INTO teachers (name, email, password_hash) VALUES (%s, %s, %s)",
            (name, email, password)
        )
        teacher_id = cur.lastrowid
        return jsonify({"id": teacher_id, "name": name, "email": email})
    finally:
        cur.close()
        db.close()






@app.route("/api/admin/students", methods=["GET"])
def admin_list_students():
    """
    Optional query param: ?classId=1
    """
    class_id = request.args.get("classId")
    db = get_db()
    cur = db.cursor()

    try:
        if class_id:
            cur.execute(
                """
                SELECT s.id, s.name, s.reg_num, c.department, c.year, c.section
                FROM students s
                JOIN classes c ON s.class_id = c.id
                WHERE c.id = %s
                ORDER BY s.reg_num
                """,
                (class_id,)
            )
        else:
            cur.execute(
                """
                SELECT s.id, s.name, s.reg_num, c.department, c.year, c.section
                FROM students s
                JOIN classes c ON s.class_id = c.id
                ORDER BY s.reg_num
                """
            )
        rows = cur.fetchall()
        students = []
        for row in rows:
            s_id, name, reg, dept, year, section = row
            students.append({
                "id": s_id,
                "name": name,
                "regNum": reg,
                "class": {
                    "department": dept,
                    "year": year,
                    "section": section
                }
            })
        return jsonify(students)
    finally:
        cur.close()
        db.close()


@app.route("/api/admin/students", methods=["POST"])
def admin_create_student():
    data = request.get_json() or {}
    name = data.get("name")
    reg_num = data.get("regNum")
    password = data.get("password")
    class_id = data.get("classId")

    if not name or not reg_num or not password or not class_id:
        return jsonify({"error": "Missing fields"}), 400

    db = get_db()
    cur = db.cursor()

    try:
        cur.execute(
            "INSERT INTO students (name, reg_num, password_hash, class_id) VALUES (%s, %s, %s, %s)",
            (name, reg_num, password, class_id)
        )
        student_id = cur.lastrowid
        return jsonify({
            "id": student_id,
            "name": name,
            "regNum": reg_num,
            "classId": class_id
        })
    finally:
        cur.close()
        db.close()

@app.route("/api/admin/students/bulk", methods=["POST"])
def admin_bulk_students():
    data = request.get_json() or {}
    students = data.get("students", [])

    if not students:
        return jsonify({"error": "No students provided"}), 400

    db = get_db()
    cur = db.cursor()

    created = []
    errors = []

    try:
        for idx, stu in enumerate(students):
            name = stu.get("name")
            reg_num = stu.get("regNum")
            password = stu.get("password")
            class_id = stu.get("classId")

            if not name or not reg_num or not password or not class_id:
                errors.append({"index": idx, "regNum": reg_num, "error": "missing fields"})
                continue

            try:
                cur.execute(
                    "INSERT INTO students (name, reg_num, password_hash, class_id) VALUES (%s, %s, %s, %s)",
                    (name, reg_num, password, class_id)
                )
                created.append({"index": idx, "regNum": reg_num})
            except mysql.connector.Error as e:
                errors.append({"index": idx, "regNum": reg_num, "error": str(e)})

        return jsonify({"created": created, "errors": errors})
    finally:
        cur.close()
        db.close()


# ---------------------- MAIN ------------------------ #

if __name__ == "__main__":
    # debug=True for development; turn off in production
    app.run(host="0.0.0.0", port=5001, debug=True)
