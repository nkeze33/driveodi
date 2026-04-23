import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    startDate: "",
    testDate: "",
    notes: "",
    overallProgress: "not_started",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load existing student data
  useEffect(() => {
    const loadStudent = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/students/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load student");
        }

        setFormData({
          fullName: data.fullName || "",
          phone: data.phone || "",
          email: data.email || "",
          startDate: data.startDate ? data.startDate.split("T")[0] : "",
          testDate: data.testDate ? data.testDate.split("T")[0] : "",
          notes: data.notes || "",
          overallProgress: data.overallProgress || "not_started",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStudent();
  }, [id]);

  // Handle changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      // If start date becomes later than test date, clear test date
      if (
        name === "startDate" &&
        updated.testDate &&
        updated.testDate < value
      ) {
        updated.testDate = "";
      }

      return updated;
    });
  };

  // Submit updated student
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Frontend validation rules
    if (formData.startDate && formData.startDate < today) {
      setError("Start date cannot be earlier than today.");
      return;
    }

    if (
      formData.startDate &&
      formData.testDate &&
      formData.testDate < formData.startDate
    ) {
      setError("Test date cannot be earlier than the start date.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/students/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update student");
      }

      navigate(`/student/${id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p className="page">Loading student...</p>;
  }

  return (
    <div className="page">
      <div className="top-nav">
        <Link to={`/student/${id}`}>← Back to Student Profile</Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="title">Edit Student</h1>
          <p className="subtitle">Update this student’s details.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: "700px" }}>
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              min={today}
            />
          </div>

          <div className="form-group">
            <label>Test Date</label>
            <input
              type="date"
              name="testDate"
              value={formData.testDate}
              onChange={handleChange}
              min={formData.startDate || today}
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

          <div className="form-group">
            <label>Overall Progress</label>
            <select
              name="overallProgress"
              value={formData.overallProgress}
              onChange={handleChange}
            >
              <option value="not_started">Not Started</option>
              <option value="needs_work">Needs Work</option>
              <option value="improving">Improving</option>
              <option value="competent">Competent</option>
              <option value="test_ready">Test Ready</option>
            </select>
          </div>

          <div className="actions">
            <button type="submit" className="button">
              Save Changes
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

export default EditStudent;