import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function AddStudent() {
  const navigate = useNavigate();

  // Get today's date in YYYY-MM-DD format for date validation
  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    startDate: "",
    testDate: "",
    notes: "",
  });

  const [error, setError] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      // If start date changes and test date is now earlier than start date,
      // clear the test date so the user is forced to choose a valid one.
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

  // Submit form
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
      const response = await fetch("http://localhost:5000/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create student");
      }

      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="top-nav">
        <Link to="/dashboard">← Back to Dashboard</Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="title">Add New Student</h1>
          <p className="subtitle">Create a new learner profile.</p>
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

          <div className="actions">
            <button type="submit" className="button">
              Create Student
            </button>

            <Link to="/" className="button-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddStudent;