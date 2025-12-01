import React, { useState, useEffect } from "react";
import {
  Upload,
  Plus,
  Send,
  Clock,
  CheckCircle,
  LogOut,
  User,
  Book,
} from "lucide-react";

// CHANGE THIS TO YOUR FLASK URL
const API_BASE = "http://localhost:5001";

function App() {
  const [userType, setUserType] = useState(null); // "teacher" | "student" | null
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogout = () => {
    setUserType(null);
    setCurrentUser(null);
  };

  if (!userType) {
    return (
      <LoginPage setUserType={setUserType} setCurrentUser={setCurrentUser} />
    );
  }

  if (userType === "teacher") {
    return (
      <TeacherDashboard user={currentUser} onLogout={handleLogout} />
    );
  }

  if (userType === "admin") {
  return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
}

  return (
    <StudentDashboard user={currentUser} onLogout={handleLogout} />
  );
}

/* ------------------------------------------------------------------ */
/* LOGIN PAGE                                                         */
/* ------------------------------------------------------------------ */

function LoginPage({ setUserType, setCurrentUser }) {
  const [activeTab, setActiveTab] = useState("student"); // "student" | "teacher" | "admin"
  const [credentials, setCredentials] = useState({
    identifier: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
  if (!credentials.identifier || !credentials.password) {
    alert("Please enter both identifier and password");
    return;
  }

  try {
    setLoading(true);

    if (activeTab === "admin") {
      // call admin login
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: credentials.identifier,
          password: credentials.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Invalid admin credentials");
        return;
      }
      setCurrentUser(data);     // {id, name, email}
      setUserType("admin");
      return;
    }

    // existing teacher / student login
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: activeTab === "teacher" ? "teacher" : "student",
        identifier: credentials.identifier,
        password: credentials.password,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Invalid credentials");
      return;
    }

    setCurrentUser(data.user);
    setUserType(data.type); // "teacher" | "student"
  } catch (err) {
    console.error(err);
    alert("Server error. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Book className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Mock Test System</h1>
        </div>

        <div className="flex mb-6 border-b">
  <button
    onClick={() => setActiveTab("student")}
    className={`flex-1 py-3 font-semibold ${
      activeTab === "student"
        ? "border-b-2 border-blue-600 text-blue-600"
        : "text-gray-500"
    }`}
  >
    Student Login
  </button>
  <button
    onClick={() => setActiveTab("teacher")}
    className={`flex-1 py-3 font-semibold ${
      activeTab === "teacher"
        ? "border-b-2 border-blue-600 text-blue-600"
        : "text-gray-500"
    }`}
  >
    Teacher Login
  </button>
  <button
    onClick={() => setActiveTab("admin")}
    className={`flex-1 py-3 font-semibold ${
      activeTab === "admin"
        ? "border-b-2 border-blue-600 text-blue-600"
        : "text-gray-500"
    }`}
  >
    Admin Login
  </button>
</div>


        <div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-medium">
  {activeTab === "teacher"
    ? "Email"
    : activeTab === "admin"
    ? "Admin Email"
    : "Registration Number"}
</label>
<input
  type="text"
  value={credentials.identifier}
  onChange={(e) =>
    setCredentials({ ...credentials, identifier: e.target.value })
  }
  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  placeholder={
    activeTab === "teacher"
      ? "teacher@test.com"
      : activeTab === "admin"
      ? "admin@test.com"
      : "ST001"
  }
/>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-medium">
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-4 rounded">
          <p className="font-semibold mb-2">Demo Credentials (example):</p>
          <p>Teacher: teacher@test.com / teacher123</p>
          <p>Student: ST001 / student123</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ADMIN DASHBOARD                                                  */
/* ------------------------------------------------------------------ */


function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("classes"); // "classes" | "teachers" | "students" | "bulk"

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Book className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user.name}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setActiveTab("classes")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "classes"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Classes
          </button>
          <button
            onClick={() => setActiveTab("teachers")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "teachers"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Teachers
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "students"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "bulk"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Bulk Upload Students
          </button>
        </div>

        {activeTab === "classes" && <AdminClasses />}
        {activeTab === "teachers" && <AdminTeachers />}
        {activeTab === "students" && <AdminStudents />}
        {activeTab === "bulk" && <AdminBulkStudents />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ADMIN CLASSES                                                  */
/* ------------------------------------------------------------------ */

function AdminClasses() {
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ department: "", year: "", section: "" });

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/classes`)
      .then((res) => res.json())
      .then(setClasses)
      .catch((err) => console.error(err));
  }, []);

  const createClass = async () => {
    if (!form.department || !form.year || !form.section) {
      alert("Fill all fields");
      return;
    }
    const res = await fetch(`${API_BASE}/api/admin/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        department: form.department,
        year: Number(form.year),
        section: form.section,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to create class");
      return;
    }
    setClasses([...classes, data]);
    setForm({ department: "", year: "", section: "" });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Manage Classes</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="Department"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="number"
          placeholder="Year"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Section"
          value={form.section}
          onChange={(e) => setForm({ ...form, section: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
      </div>
      <button
        onClick={createClass}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Add Class
      </button>

      <h3 className="text-lg font-semibold mb-2">Existing Classes</h3>
      <ul className="space-y-2">
        {classes.map((c) => (
          <li
            key={c.id}
            className="border rounded-lg px-3 py-2 flex justify-between"
          >
            <span>
              {c.department} - {c.year} - {c.section}
            </span>
            <span className="text-sm text-gray-500">ID: {c.id}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ADMIN TEACHERS                                                  */
/* ------------------------------------------------------------------ */

function AdminTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/teachers`)
      .then((res) => res.json())
      .then(setTeachers)
      .catch((err) => console.error(err));
  }, []);

  const createTeacher = async () => {
    if (!form.name || !form.email || !form.password) {
      alert("Fill all fields");
      return;
    }
    const res = await fetch(`${API_BASE}/api/admin/teachers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to create teacher");
      return;
    }
    setTeachers([...teachers, data]);
    setForm({ name: "", email: "", password: "" });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Manage Teachers</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
      </div>
      <button
        onClick={createTeacher}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Add Teacher
      </button>

      <h3 className="text-lg font-semibold mb-2">Existing Teachers</h3>
      <ul className="space-y-2">
        {teachers.map((t) => (
          <li
            key={t.id}
            className="border rounded-lg px-3 py-2 flex justify-between"
          >
            <span>{t.name}</span>
            <span className="text-sm text-gray-500">{t.email}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ADMIN STUDENTS                                                 */
/* ------------------------------------------------------------------ */

function AdminStudents() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    name: "",
    regNum: "",
    password: "",
    classId: "",
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/classes`)
      .then((res) => res.json())
      .then(setClasses)
      .catch((err) => console.error(err));
  }, []);

  const loadStudents = async (classId) => {
    const url = classId
      ? `${API_BASE}/api/admin/students?classId=${classId}`
      : `${API_BASE}/api/admin/students`;
    const res = await fetch(url);
    const data = await res.json();
    if (res.ok) setStudents(data);
  };

  useEffect(() => {
    loadStudents(selectedClassId);
  }, [selectedClassId]);

  const createStudent = async () => {
    if (!form.name || !form.regNum || !form.password || !form.classId) {
      alert("Fill all fields");
      return;
    }
    const res = await fetch(`${API_BASE}/api/admin/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        regNum: form.regNum,
        password: form.password,
        classId: Number(form.classId),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to create student");
      return;
    }
    setForm({ name: "", regNum: "", password: "", classId: "" });
    loadStudents(selectedClassId);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Manage Students</h2>

      <div className="flex flex-wrap gap-4 mb-4">
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.department} - {c.year} - {c.section}
            </option>
          ))}
        </select>
        <button
          onClick={() => loadStudents(selectedClassId)}
          className="bg-gray-200 px-4 py-2 rounded-lg"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Reg Number"
          value={form.regNum}
          onChange={(e) => setForm({ ...form, regNum: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <select
          value={form.classId}
          onChange={(e) => setForm({ ...form, classId: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Select class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.department} - {c.year} - {c.section}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={createStudent}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Add Student
      </button>

      <h3 className="text-lg font-semibold mb-2">Students</h3>
      <div className="max-h-72 overflow-y-auto space-y-2">
        {students.map((s) => (
          <div
            key={s.id}
            className="border rounded-lg px-3 py-2 flex justify-between"
          >
            <div>
              <p className="font-medium">
                {s.name} ({s.regNum})
              </p>
              <p className="text-sm text-gray-500">
                {s.class.department} - {s.class.year} - {s.class.section}
              </p>
            </div>
            <span className="text-sm text-gray-400">ID: {s.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/* ADMIN BULK STUDENTS                                                  */
/* ------------------------------------------------------------------ */

function AdminBulkStudents() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/classes`)
      .then((res) => res.json())
      .then(setClasses)
      .catch((err) => console.error(err));
  }, []);

  const parseAndUpload = async () => {
    if (!classId) {
      alert("Select class first");
      return;
    }
    if (!csvText.trim()) {
      alert("Paste CSV text");
      return;
    }

    // Expecting lines: name,regNum,password
    const lines = csvText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const students = lines.map((line) => {
      const [name, regNum, password] = line.split(",").map((s) => s.trim());
      return { name, regNum, password, classId: Number(classId) };
    });

    const res = await fetch(`${API_BASE}/api/admin/students/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ students }),
    });
    const data = await res.json();
    setResult(data);
    if (!res.ok) {
      alert(data.error || "Bulk upload failed");
    } else {
      alert("Bulk upload attempted. Check results below.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Bulk Upload Students
      </h2>

      <div className="mb-4">
        <label className="block mb-2 font-medium">Select Class</label>
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Select class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.department} - {c.year} - {c.section}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-medium">
          Paste CSV (name,regNum,password per line)
        </label>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
          placeholder={`Example:
Alice Johnson,ST101,student123
Bob Kumar,ST102,student123`}
        />
      </div>

      <button
        onClick={parseAndUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Upload
      </button>

      {result && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Upload Summary</h3>
          <p className="text-sm text-green-700 mb-1">
            Created: {result.created?.length || 0}
          </p>
          <p className="text-sm text-red-700 mb-2">
            Errors: {result.errors?.length || 0}
          </p>
          {result.errors?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              {result.errors.map((e, idx) => (
                <div key={idx}>
                  Line {e.index + 1} ({e.regNum || "N/A"}): {e.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


/* ------------------------------------------------------------------ */
/* TEACHER DASHBOARD                                                  */
/* ------------------------------------------------------------------ */

function TeacherDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("schedule"); // "schedule" | "results"

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Book className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Teacher Dashboard
              </h1>
              <p className="text-sm text-gray-600">Welcome, {user.name}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === "schedule"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Schedule Test
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === "results"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            View Results
          </button>
        </div>

        {activeTab === "schedule" ? (
          <ScheduleTest user={user} />
        ) : (
          <TeacherViewResults user={user} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SCHEDULE TEST (TEACHER)                                            */
/* ------------------------------------------------------------------ */

function ScheduleTest({ user }) {
  const [formData, setFormData] = useState({
    subject: "",
    scheduledDate: "",
    duration: 60,
    classId: "",
  });
  const [classes, setClasses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: "",
    choices: ["", "", "", ""],
    correctAnswer: 0,
    score: 5,
  });
  const [uploadMethod, setUploadMethod] = useState("manual");
  const [saving, setSaving] = useState(false);

  // Load classes (department/year/section)
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/classes`);
        const data = await res.json();
        setClasses(data);
      } catch (err) {
        console.error(err);
        alert("Failed to load classes");
      }
    };
    fetchClasses();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          // expecting { "questions": [ {question, choices[4], correctAnswer, score}, ... ] }
          setQuestions(
            (json.questions || []).map((q, idx) => ({
              ...q,
              id: Date.now() + idx,
            }))
          );
          alert("Questions uploaded successfully!");
        } catch (error) {
          console.error(error);
          alert("Invalid JSON format");
        }
      };
      reader.readAsText(file);
    }
  };

  const addQuestion = () => {
    if (
      currentQuestion.question.trim() &&
      currentQuestion.choices.every((c) => c.trim())
    ) {
      setQuestions([...questions, { ...currentQuestion, id: Date.now() }]);
      setCurrentQuestion({
        question: "",
        choices: ["", "", "", ""],
        correctAnswer: 0,
        score: 5,
      });
    } else {
      alert("Please fill the question and all choices");
    }
  };

  const scheduleTest = async () => {
    if (
      !formData.subject ||
      !formData.scheduledDate ||
      !formData.duration ||
      !formData.classId ||
      questions.length === 0
    ) {
      alert("Please fill all fields and add at least one question");
      return;
    }

    const payload = {
      subject: formData.subject,
      scheduledDate: formData.scheduledDate,
      duration: Number(formData.duration),
      classId: Number(formData.classId),
      questions,
      teacherId: user.id,
    };

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to schedule test");
        return;
      }
      alert("Test scheduled successfully!");
      setFormData({
        subject: "",
        scheduledDate: "",
        duration: 60,
        classId: "",
      });
      setQuestions([]);
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Schedule New Test
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-gray-700 mb-2 font-medium">
            Subject
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Mathematics"
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2 font-medium">
            Scheduled Date & Time
          </label>
          <input
            type="datetime-local"
            value={formData.scheduledDate}
            onChange={(e) =>
              setFormData({ ...formData, scheduledDate: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2 font-medium">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) =>
              setFormData({
                ...formData,
                duration: parseInt(e.target.value || "0", 10),
              })
            }
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2 font-medium">
            Class (Dept / Year / Section)
          </label>
          <select
            value={formData.classId}
            onChange={(e) =>
              setFormData({ ...formData, classId: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.department} - {c.year} - {c.section}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 mb-3 font-medium">
          Upload Method
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => setUploadMethod("manual")}
            className={`px-6 py-2 rounded-lg font-semibold ${
              uploadMethod === "manual"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setUploadMethod("file")}
            className={`px-6 py-2 rounded-lg font-semibold ${
              uploadMethod === "file"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Upload JSON File
          </button>
        </div>
      </div>

      {uploadMethod === "file" ? (
        <div className="mb-6">
          <label className="block text-gray-700 mb-2 font-medium">
            Upload Questions (JSON)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold"
            >
              Click to upload JSON file
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Expected format: {"{"}"questions": [ ... ]{"}"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Add Question
          </h3>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Question</label>
            <input
              type="text"
              value={currentQuestion.question}
              onChange={(e) =>
                setCurrentQuestion({
                  ...currentQuestion,
                  question: e.target.value,
                })
              }
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter question"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {currentQuestion.choices.map((choice, idx) => (
              <div key={idx}>
                <label className="block text-gray-700 mb-2">
                  Choice {idx + 1}
                </label>
                <input
                  type="text"
                  value={choice}
                  onChange={(e) => {
                    const newChoices = [...currentQuestion.choices];
                    newChoices[idx] = e.target.value;
                    setCurrentQuestion({
                      ...currentQuestion,
                      choices: newChoices,
                    });
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Choice ${idx + 1}`}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2">
                Correct Answer (Index)
              </label>
              <select
                value={currentQuestion.correctAnswer}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    correctAnswer: parseInt(e.target.value, 10),
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[0, 1, 2, 3].map((i) => (
                  <option key={i} value={i}>
                    Choice {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Score</label>
              <input
                type="number"
                value={currentQuestion.score}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    score: parseInt(e.target.value || "0", 10),
                  })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={addQuestion}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            Add Question
          </button>
        </div>
      )}

      {questions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            Questions Added: {questions.length}
          </h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">
                  {idx + 1}. {q.question}
                </p>
                <p className="text-sm text-gray-600">Score: {q.score}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={scheduleTest}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-70"
      >
        <Clock className="w-5 h-5" />
        {saving ? "Scheduling..." : "Schedule Test"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TEACHER VIEW RESULTS                                               */
/* ------------------------------------------------------------------ */

function TeacherViewResults({ user }) {
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [results, setResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loadingTests, setLoadingTests] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);

  // Load tests created by this teacher
  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoadingTests(true);
        // you need to implement this endpoint in Flask:
        // GET /api/tests/teacher/<teacher_id>
        const res = await fetch(
          `${API_BASE}/api/tests/teacher/${user.id}`
        );
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || "Failed to load tests");
          return;
        }
        setTests(data);
      } catch (err) {
        console.error(err);
        alert("Failed to load tests");
      } finally {
        setLoadingTests(false);
      }
    };
    fetchTests();
  }, [user.id]);

  const loadResultsForTest = async (testId) => {
    if (!testId) return;
    try {
      setLoadingResults(true);
      const res = await fetch(`${API_BASE}/api/results/test/${testId}`);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to load results");
        return;
      }
      setResults(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load results");
    } finally {
      setLoadingResults(false);
    }
  };

  const handleSelectTest = (e) => {
    const val = e.target.value;
    setSelectedTestId(val);
    setSelectedStudent(null);
    setFeedback("");
    if (val) {
      loadResultsForTest(val);
    } else {
      setResults([]);
    }
  };

  const sendResult = async (result) => {
    if (!feedback.trim()) {
      alert("Please enter feedback (or at least a short remark)");
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE}/api/results/${result.id}/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to send feedback");
        return;
      }
      alert(`Feedback saved for ${result.studentName}`);
      // Update local state
      setResults((prev) =>
        prev.map((r) =>
          r.id === result.id
            ? { ...r, feedback, sent: true }
            : r
        )
      );
      setSelectedStudent(null);
      setFeedback("");
    } catch (err) {
      console.error(err);
      alert("Failed to send feedback");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Student Results
      </h2>

      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1">
          <label className="block text-gray-700 mb-2 font-medium">
            Select Test
          </label>
          <select
            value={selectedTestId}
            onChange={handleSelectTest}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Choose a test --</option>
            {tests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.subject} | {new Date(t.scheduledDate || t.scheduled_datetime).toLocaleString()}
              </option>
            ))}
          </select>
        </div>
        {loadingTests && <p className="text-gray-500">Loading tests...</p>}
      </div>

      {loadingResults && (
        <p className="text-gray-500 mb-4">Loading results...</p>
      )}

      {selectedTestId && results.length === 0 && !loadingResults && (
        <p className="text-gray-500">No results yet for this test.</p>
      )}

      <div className="space-y-4">
        {results.map((result) => (
          <div
            key={result.id}
            className="border rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {result.studentName}
                </h3>
                <p className="text-gray-600">
                  Reg: {result.studentRegNum}
                </p>
                <p className="text-gray-600">
                  Submitted:{" "}
                  {new Date(result.submittedAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  {result.score}/{result.totalScore}
                </p>
                <p className="text-sm text-gray-600">
                  {(
                    (result.score / result.totalScore) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>

            {selectedStudent?.id === result.id ? (
              <div className="mt-4">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter feedback"
                  rows="3"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => sendResult(result)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                    Save Feedback
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      setFeedback("");
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setSelectedStudent(result);
                  setFeedback(result.feedback || "");
                }}
                className="mt-4 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Send className="w-4 h-4" />
                {result.sent ? "Edit Feedback" : "Add Feedback"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* STUDENT DASHBOARD                                                  */
/* ------------------------------------------------------------------ */

function StudentDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("ongoing"); // "ongoing" | "results"
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loadingTests, setLoadingTests] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);

  // Load tests & results for this student
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingTests(true);
        const resTests = await fetch(
          `${API_BASE}/api/tests/student/${user.id}`
        );
        const dataTests = await resTests.json();
        if (!resTests.ok) {
          alert(dataTests.error || "Failed to load tests");
        } else {
          // each test: {id, subject, scheduled_datetime or scheduledDate, duration_minutes or duration, status}
          setTests(
            dataTests.map((t) => ({
              ...t,
              scheduledDate: t.scheduledDate || t.scheduled_datetime,
              duration: t.duration || t.duration_minutes,
            }))
          );
        }
      } catch (err) {
        console.error(err);
        alert("Error loading tests");
      } finally {
        setLoadingTests(false);
      }

      try {
        setLoadingResults(true);
        const resResults = await fetch(
          `${API_BASE}/api/results/student/${user.id}`
        );
        const dataResults = await resResults.json();
        if (!resResults.ok) {
          alert(dataResults.error || "Failed to load results");
        } else {
          setResults(dataResults);
        }
      } catch (err) {
        console.error(err);
        alert("Error loading results");
      } finally {
        setLoadingResults(false);
      }
    };

    fetchData();
  }, [user.id]);

  const ongoingTests = tests.filter((t) => t.status !== "completed");
  const studentResults = results;

  const startTest = async (test) => {
    try {
      const res = await fetch(`${API_BASE}/api/tests/${test.id}`);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to load test details");
        return;
      }
      setSelectedTest(data);
      setAnswers({});
    } catch (err) {
      console.error(err);
      alert("Error loading test details");
    }
  };

  const submitTest = async () => {
    if (!selectedTest) return;
    if (
      Object.keys(answers).length < selectedTest.questions.length
    ) {
      const confirmPartial = window.confirm(
        "You have not answered all questions. Submit anyway?"
      );
      if (!confirmPartial) return;
    }

    const payload = {
      studentId: user.id,
      answers: answers, // {questionId: selectedIndex}
    };

    try {
      const res = await fetch(
        `${API_BASE}/api/tests/${selectedTest.id}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Submit failed");
        return;
      }
      alert(
        `Test submitted successfully! Score: ${data.score}/${data.totalScore}`
      );
      setSelectedTest(null);
      setAnswers({});

      // Refresh results
      const resResults = await fetch(
        `${API_BASE}/api/results/student/${user.id}`
      );
      const dataResults = await resResults.json();
      if (resResults.ok) {
        setResults(dataResults);
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting test");
    }
  };

  if (selectedTest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-800">
              {selectedTest.subject} Test
            </h1>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedTest.questions.map((q, idx) => (
              <div key={q.id} className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  {idx + 1}. {q.question} ({q.score} points)
                </h3>
                <div className="space-y-2">
                  {q.choices.map((choice, cIdx) => (
                    <label
                      key={cIdx}
                      className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={cIdx}
                        checked={answers[q.id] === cIdx}
                        onChange={() =>
                          setAnswers({
                            ...answers,
                            [q.id]: cIdx,
                          })
                        }
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-3 text-gray-700">
                        {choice}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-4">
              <button
                onClick={submitTest}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Submit Test
              </button>
              <button
                onClick={() => {
                  setSelectedTest(null);
                  setAnswers({});
                }}
                className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Student Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Welcome, {user.name} ({user.regNum})
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("ongoing")}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === "ongoing"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Ongoing Tests
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === "results"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            My Results
          </button>
        </div>

        {activeTab === "ongoing" ? (
          <>
            {loadingTests && (
              <p className="text-gray-500 mb-4">
                Loading tests...
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ongoingTests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {test.subject}
                      </h3>
                      <p className="text-gray-600">
                        Duration: {test.duration} minutes
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Scheduled:{" "}
                    {test.scheduledDate
                      ? new Date(test.scheduledDate).toLocaleString()
                      : "-"}
                  </p>
                  <button
                    onClick={() => startTest(test)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Start Test
                  </button>
                </div>
              ))}
              {!loadingTests && ongoingTests.length === 0 && (
                <div className="col-span-2 text-center py-12 text-gray-500">
                  No ongoing tests available
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {loadingResults && (
              <p className="text-gray-500 mb-4">
                Loading results...
              </p>
            )}
            <div className="space-y-4">
              {studentResults.map((result) => (
                <div
                  key={result.id}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {result.subject}
                      </h3>
                      <p className="text-gray-600">
                        Submitted:{" "}
                        {new Date(
                          result.submittedAt
                        ).toLocaleString()}
                      </p>
                      {result.feedback && (
                        <div className="mt-3 bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm font-semibold text-gray-700">
                            Teacher Feedback:
                          </p>
                          <p className="text-gray-700">
                            {result.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold text-blue-600">
                        {result.score}/{result.totalScore}
                      </p>
                      <p className="text-gray-600">
                        {(
                          (result.score / result.totalScore) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {!loadingResults && studentResults.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No results available yet
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
