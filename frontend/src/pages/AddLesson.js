import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

function AddLesson() {
  // Get student ID from the URL
  const { id } = useParams();

  // Used to redirect after saving
  const navigate = useNavigate();

  // ==========================================
  // FORM STATE
  // These are all lesson-level fields.
  // ==========================================
  const [formData, setFormData] = useState({
    lessonDate: "",
    durationMinutes: 60,
    lessonRating: "",
    nextLessonFocus: "",
    notes: "",
    topicsCovered: "",
  });

  // Store error messages
  const [error, setError] = useState("");

  // ==========================================
  // HANDLE INPUT CHANGES
  // Updates the matching field in formData.
  // ==========================================
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ==========================================
  // SUBMIT LESSON
  // Sends lesson data to backend using auth token.
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Build payload in the format backend expects
    const payload = {
      studentId: id,
      lessonDate: formData.lessonDate,
      durationMinutes: Number(formData.durationMinutes),
      lessonRating: formData.lessonRating ? Number(formData.lessonRating) : undefined,
      nextLessonFocus: formData.nextLessonFocus,
      notes: formData.notes,
      topicsCovered: formData.topicsCovered
        ? formData.topicsCovered
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    };

    try {
      const response = await fetch("http://localhost:5000/api/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add lesson");
      }

      // Go back to student profile after successful save
      navigate(`/student/${id}`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="page">
      {/* Top navigation */}
      <div className="top-nav">
        <Link to={`/student/${id}`}>← Back to Student Profile</Link>
      </div>

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="title">Add Lesson</h1>
          <p className="subtitle">Record a new lesson for this student.</p>
        </div>
      </div>

      {/* Form card */}
      <div className="card" style={{ maxWidth: "700px" }}>
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Lesson Date */}
          <div className="form-group">
            <label>Lesson Date</label>
            <input
              type="date"
              name="lessonDate"
              value={formData.lessonDate}
              onChange={handleChange}
              required
            />
          </div>

          {/* Duration */}
          <div className="form-group">
            <label>Duration (minutes)</label>
            <input
              type="number"
              name="durationMinutes"
              value={formData.durationMinutes}
              onChange={handleChange}
              min="1"
            />
          </div>

          {/* Rating */}
          <div className="form-group">
            <label>Rating</label>
            <select
              name="lessonRating"
              value={formData.lessonRating}
              onChange={handleChange}
            >
              <option value="">Select rating</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>

          {/* Next Focus */}
          <div className="form-group">
            <label>Next Focus</label>
            <input
              type="text"
              name="nextLessonFocus"
              value={formData.nextLessonFocus}
              onChange={handleChange}
              placeholder="Example: Roundabouts and manoeuvres"
            />
          </div>

          {/* Topics Covered */}
          <div className="form-group">
            <label>Topics Covered</label>
            <input
              type="text"
              name="topicsCovered"
              value={formData.topicsCovered}
              onChange={handleChange}
              placeholder="Example: Mirrors, Parking, Junctions"
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
            />
          </div>

          {/* Action buttons */}
          <div className="actions">
            <button type="submit" className="button">
              Save Lesson
            </button>

            <Link to={`/student/${id}`} className="button-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddLesson;