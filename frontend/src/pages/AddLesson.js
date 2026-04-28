import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

function AddLesson() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Today's date in YYYY-MM-DD format.
  // Used to stop users selecting past lesson dates.
  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    lessonDate: "",
    durationMinutes: 60,
    lessonRating: "",
    nextLessonFocus: "",
    notes: "",
    topicsCovered: "",
  });

  const [error, setError] = useState("");

  // Updates form fields as the user types/selects.
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Submits lesson data to the backend.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Frontend protection: prevent past dates.
    if (formData.lessonDate < today) {
      setError("Lesson date cannot be in the past.");
      return;
    }

    const payload = {
      studentId: id,
      lessonDate: formData.lessonDate,
      durationMinutes: Number(formData.durationMinutes),
      lessonRating: formData.lessonRating
        ? Number(formData.lessonRating)
        : undefined,
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
      const response = await fetch(`${API_BASE_URL}/api/lessons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text || "Failed to add lesson" };
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to add lesson");
      }

      navigate(`/student/${id}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <div className="page">
      <div className="top-nav">
        <Link to={`/student/${id}`}>← Back to Student Profile</Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="title">Add Lesson</h1>
          <p className="subtitle">Record a new lesson for this student.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: "700px" }}>
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Lesson Date</label>
            <input
              type="date"
              name="lessonDate"
              value={formData.lessonDate}
              onChange={handleChange}
              min={today}
              required
            />
          </div>

          <div className="form-group">
            <label>Duration (minutes)</label>
            <input
              type="number"
              name="durationMinutes"
              value={formData.durationMinutes}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Rating</label>
            <select
              name="lessonRating"
              value={formData.lessonRating}
              onChange={handleChange}
            >
              <option value="">Select rating</option>
              <option value="1">1 - Poor</option>
              <option value="2">2 - Needs work</option>
              <option value="3">3 - Average</option>
              <option value="4">4 - Good</option>
              <option value="5">5 - Excellent</option>
            </select>
          </div>

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

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
            />
          </div>

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