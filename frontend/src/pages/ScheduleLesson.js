import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { getToken, logout } from "../utils/auth";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

function ScheduleLesson() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedStudentId = searchParams.get("studentId") || "";

  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState(preselectedStudentId);
  const [lessonDate, setLessonDate] = useState("");
  const [lessonTime, setLessonTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [notes, setNotes] = useState("");

  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/students`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        if (res.status === 401) {
          logout();
          navigate("/login");
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load students.");
        }

        setStudents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Load students error:", error);
        setMessage("Could not load students.");
      }
    };

    fetchStudents();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!studentId || !lessonDate || !lessonTime) {
      setMessage("Please select a student, date, and time.");
      return;
    }

    try {
      setIsSaving(true);

      const res = await fetch(`${API_BASE_URL}/api/scheduled-lessons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          studentId,
          lessonDate,
          lessonTime,
          durationMinutes: Number(durationMinutes),
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to schedule lesson.");
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Schedule lesson error:", error);
      setMessage(error.message || "Failed to schedule lesson.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="title">Schedule Lesson</h1>
          <p className="subtitle">
            Book a future lesson for a student.
          </p>
        </div>

        <Link to="/dashboard" className="button-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="card">
        {message && (
          <div style={{ marginBottom: "14px", fontWeight: "bold" }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>Student</label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          >
            <option value="">Select student</option>
            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {student.fullName}
              </option>
            ))}
          </select>

          <label>Lesson Date</label>
          <input
            type="date"
            value={lessonDate}
            onChange={(e) => setLessonDate(e.target.value)}
            required
          />

          <label>Lesson Time</label>
          <input
            type="time"
            value={lessonTime}
            onChange={(e) => setLessonTime(e.target.value)}
            required
          />

          <label>Duration</label>
          <select
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          >
            <option value={60}>1 hour</option>
            <option value={90}>1 hour 30 minutes</option>
            <option value={120}>2 hours</option>
            <option value={150}>2 hours 30 minutes</option>
            <option value={180}>3 hours</option>
          </select>

          <label>Focus / Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Example: Roundabouts, parking, test route practice..."
            rows="4"
          />

          <button type="submit" className="button" disabled={isSaving}>
            {isSaving ? "Scheduling..." : "Schedule Lesson"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ScheduleLesson;