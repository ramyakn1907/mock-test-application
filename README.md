---

# 📘 Mock Test System

A full-stack web application that allows **teachers to create and schedule tests** and **students to take tests online**, with **automatic scoring**, **class-based test distribution**, and **teacher feedback**.

---

# 🚀 Features

## 👨‍🏫 **Teacher Features**

* Teacher login
* Schedule a test for a **specific class (Dept / Year / Section)**
* Add questions manually or upload from JSON
* View all scheduled tests
* View student submissions
* Give feedback to students
* Automatically calculates scores
* Results overview

---

## 👨‍🎓 **Student Features**

* Student login
* Students are mapped to **class & section** in DB
* Students can only see tests assigned to their class
* Clean test interface with MCQs
* Auto-calculated score on submission
* View all previous results
* Read teacher feedback

---

# 🏗️ Tech Stack

### **Frontend**

* React.js
* Tailwind CSS
* Fetch API for backend communication

### **Backend**

* Python Flask
* Flask-CORS
* REST APIs
* Auto scoring logic

### **Database**

* MySQL
* Tables:

  * teachers
  * students
  * classes
  * tests
  * questions
  * results
  * answers

---

# 📂 Project Structure

```
/project-root
 ├── frontend/        → React app
 ├── backend/         → Flask app
 │    ├── app.py
 │    └── ...
 ├── README.md
 └── ...
```

---

# 🔧 Backend Setup (Flask)

### 1. Create virtual environment

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
```

### 2. Install dependencies

```bash
pip install flask flask-cors mysql-connector-python
```

### 3. Update database credentials in `app.py`

```python
host="localhost"
user="root"
password="YOUR_PASSWORD"
database="mock_test_db"
```

### 4. Run backend

```bash
python app.py
```

Backend will run at:

```
http://localhost:5000
```

---

# 🎨 Frontend Setup (React)

### 1. Install packages

```bash
cd frontend
npm install
```

### 2. Start React app

```bash
npm start
```

Frontend runs at:

```
http://localhost:3000
```

---

# 🗄️ MySQL Tables

Your database must contain:

### **classes**

```
id | department | year | section
```

### **teachers**

```
id | name | email | password_hash
```

### **students**

```
id | name | reg_num | password_hash | class_id (FK)
```

### **tests**

```
id | subject | scheduled_datetime | duration_minutes | status | class_id | created_by
```

### **questions**

```
id | test_id | question_text | choice_0..choice_3 | correct_index | score
```

### **results**

```
id | student_id | test_id | score | total_score | submitted_at | feedback | sent
```

### **answers**

```
id | result_id | question_id | selected_index
```

---

# 📡 API Endpoints (Main)

### Auth

| Method | Endpoint     | Description           |
| ------ | ------------ | --------------------- |
| POST   | `/api/login` | Teacher/Student login |

### Classes

| GET | `/api/classes` | List all classes |

### Tests

| POST | `/api/tests` | Create test |
| GET  | `/api/tests/teacher/:id` | Tests created by teacher |
| GET  | `/api/tests/student/:id` | Tests available for student |
| GET  | `/api/tests/:testId` | Test details + questions |
| POST | `/api/tests/:testId/submit` | Student submits answers |

### Results

| GET | `/api/results/test/:id` | Teacher view results |
| GET | `/api/results/student/:id` | Student view results |
| POST | `/api/results/:resultId/feedback` | Teacher gives feedback |

---

# 📥 Import Sample Questions (JSON)

Example JSON format:

```json
{
  "questions": [
    {
      "question": "What is 2 + 2?",
      "choices": ["3","4","5","6"],
      "correctAnswer": 1,
      "score": 5
    }
  ]
}
```

Teachers can upload this file in the frontend.

---

# 📌 Roadmap (Future Enhancements)

* JWT Authentication
* Timer for tests
* Auto-save answers
* Admin dashboard
* Bulk student upload
* PDF export of results
* Image-based questions support

---

# 🙌 Credits

Developed by **Ramya K N**
Tech Stack: React + Flask + MySQL

---

# 📄 License

This project is open-source and available under the MIT License.

---


