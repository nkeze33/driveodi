import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

// ==========================================
// SKILL LABELS
// Converts backend camelCase keys into
// clean, readable labels for the UI.
// ==========================================
const skillLabels = {
  cockpitDrill: "Cockpit Drill",
  movingOff: "Moving Off",
  stopping: "Stopping",
  clutchControl: "Clutch Control",
  steering: "Steering",
  mirrors: "Mirrors",
  signals: "Signals",
  junctions: "Junctions",
  roundabouts: "Roundabouts",
  pedestrianCrossings: "Pedestrian Crossings",
  manoeuvres: "Manoeuvres",
  reversing: "Reversing",
  parking: "Parking",
  hillStarts: "Hill Starts",
  dualCarriageway: "Dual Carriageway",
  independentDriving: "Independent Driving",
};

// ==========================================
// SKILL VALUE LABELS
// Converts values → clean UI text
// ==========================================
const skillValueLabels = {
  not_started: "Not Started",
  needs_work: "Needs Work",
  improving: "Improving",
  competent: "Competent",
  test_ready: "Test Ready",
};

// ==========================================
// OVERALL PROGRESS LABELS
// Converts backend values into cleaner UI text
// ==========================================
const progressLabels = {
  not_started: "Not Started",
  needs_work: "Needs Work",
  improving: "Improving",
  competent: "Competent",
  test_ready: "Test Ready",
};

// ==========================================
// DAYS UNTIL TEST
// Returns:
// - "X days"
// - "Today"
// - "Passed"
// - "—" if no test date
// ==========================================
const getDaysUntilTest = (testDate) => {
  if (!testDate) return "—";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const test = new Date(testDate);
  test.setHours(0, 0, 0, 0);

  const diffMs = test - today;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Passed";
  if (diffDays === 0) return "Today";

  return `${diffDays} day${diffDays === 1 ? "" : "s"}`;
};

// ==========================================
// FORMAT MINUTES → HOURS + MINUTES
// Example: 70 → "1h 10m"
// ==========================================
const formatDuration = (minutes) => {
  const mins = Number(minutes) || 0;

  const hours = Math.floor(mins / 60);
  const remainingMinutes = mins % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

function StudentProfile() {
  // Get student ID from URL
  const { id } = useParams();

  // Used for redirecting after delete or auth failure
  const navigate = useNavigate();

  // Full student profile from backend
  const [profile, setProfile] = useState(null);

  // Error message state
  const [error, setError] = useState("");

  // ==========================================
  // LOAD STUDENT PROFILE
  // ==========================================
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/students/${id}/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (res.status === 401) {
          navigate("/login");
          return;
        }

        let data;
        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          data = { message: text || "Failed to load student profile" };
        }

        if (!res.ok) {
          throw new Error(data.message || "Failed to load student profile");
        }

        setProfile(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load student profile");
      }
    };

    loadProfile();
  }, [id, navigate]);

  // ==========================================
  // DELETE STUDENT
  // ==========================================
  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this student?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text || "Failed to delete student" };
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete student");
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    }
  };

  if (!profile) {
    return <p className="page">Loading...</p>;
  }

  const { student, lessons, skillProgress } = profile;

  // ==========================================
  // TOTAL LESSON DURATION
  // Adds all lesson durations together
  // ==========================================
  const totalLessonDuration = lessons.reduce((total, lesson) => {
    return total + (Number(lesson.durationMinutes) || 0);
  }, 0);

  return (
    <div className="page">
      {/* Top navigation */}
      <div className="top-nav">
        <Link to="/dashboard">← Back to Dashboard</Link>
      </div>

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="title">{student.fullName}</h1>
          <p className="subtitle">Student progress overview</p>
        </div>
      </div>

      {/* Error message */}
      {error && <div className="error">{error}</div>}

      {/* Student details */}
      <div className="card">
        <h2>Student Details</h2>

        <p className="info-row">
          <strong>Phone:</strong> {student.phone || "—"}
        </p>

        <p className="info-row">
          <strong>Email:</strong> {student.email || "—"}
        </p>

        <p className="info-row">
          <strong>Start Date:</strong>{" "}
          {student.startDate
            ? new Date(student.startDate).toLocaleDateString()
            : "—"}
        </p>

        <p className="info-row">
          <strong>Test Date:</strong>{" "}
          {student.testDate
            ? new Date(student.testDate).toLocaleDateString()
            : "—"}
        </p>

        <p className="info-row">
          <strong>Days Until Test:</strong> {getDaysUntilTest(student.testDate)}
        </p>

        <p className="info-row">
          <strong>Overall Progress:</strong>{" "}
          <span className="badge">
            {progressLabels[student.overallProgress] || "Not Started"}
          </span>
        </p>

        <p className="info-row">
          <strong>Notes:</strong> {student.notes || "—"}
        </p>

        {/* Action buttons */}
        <div className="actions">
          <Link to={`/student/${id}/add-lesson`} className="button">
            + Add Lesson
          </Link>

          <Link
            to={`/student/${id}/update-skills`}
            className="button-secondary"
          >
            Update Skills
          </Link>

          <Link to={`/student/${id}/edit`} className="button-secondary">
            Edit Student
          </Link>

          <button onClick={handleDelete} className="button-danger">
            Delete Student
          </button>
        </div>
      </div>

      {/* Lessons + Skills */}
      <div className="grid grid-2">
        {/* Lessons column */}
        <div className="card">
          <h2>Lessons</h2>

          <p className="info-row">
            <strong>Total Lessons Duration:</strong>{" "}
            {formatDuration(totalLessonDuration)}
          </p>

          {lessons.length === 0 ? (
            <p className="empty-text">No lessons yet.</p>
          ) : (
            lessons.map((lesson) => (
              <div key={lesson._id} className="lesson-item">
                <div className="lesson-header">
                  <strong className="lesson-date">
                    {lesson.lessonDate
                      ? new Date(lesson.lessonDate).toLocaleDateString()
                      : "—"}
                  </strong>
                </div>

                <div className="lesson-grid">
                  <div>
                    <span className="label">Duration</span>
                    <div className="value">
                      {formatDuration(lesson.durationMinutes)}
                    </div>
                  </div>

                  <div>
                    <span className="label">Rating</span>
                    <div className="value">
                      {lesson.lessonRating ? `${lesson.lessonRating}/5` : "—"}
                    </div>
                  </div>

                  <div>
                    <span className="label">Next Focus</span>
                    <div className="value">
                      {lesson.nextLessonFocus &&
                      lesson.nextLessonFocus.trim() !== ""
                        ? lesson.nextLessonFocus
                        : "Not recorded"}
                    </div>
                  </div>
                </div>

                {lesson.topicsCovered && lesson.topicsCovered.length > 0 && (
                  <div className="lesson-section">
                    <span className="label">Topics Covered</span>
                    <div className="value">{lesson.topicsCovered.join(", ")}</div>
                  </div>
                )}

                {lesson.notes && (
                  <div className="lesson-section">
                    <span className="label">Notes</span>
                    <div className="value">{lesson.notes}</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Skills column */}
        <div className="card">
          <h2>Skill Progress</h2>

          {skillProgress ? (
            <div className="skill-grid">
              {Object.entries(skillProgress.skills).map(([skill, value]) => (
                <div key={skill} className="skill-item">
                  <strong>{skillLabels[skill] || skill}</strong>
                  <div>
                    <span className={`badge ${value}`}>
                      {skillValueLabels[value] || value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">No skill progress yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;