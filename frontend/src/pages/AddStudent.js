import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// ==========================================
// API BASE URL
// Uses live backend in production and localhost in development
// ==========================================
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

function AddStudent() {
  const navigate = useNavigate();

  // ==========================================
  // TODAY'S DATE
  // Used to prevent selecting past start dates
  // Format: YYYY-MM-DD
  // ==========================================
  const today = new Date().toISOString().split("T")[0];

  // ==========================================
  // FORM STATE
  // Stores all values entered in the form
  // ==========================================
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    startDate: "",
    testDate: "",
    notes: "",
  });

  // ==========================================
  // ERROR STATE
  // Displays validation or backend errors
  // ==========================================
  const [error, setError] = useState("");

  // ==========================================
  // VALIDATE FORM
  // Frontend validation for user experience.
  // Backend validation must still exist for security.
  // ==========================================
  const validateForm = () => {
    const fullName = formData.fullName.trim();
    const phone = formData.phone.trim();
    const email = formData.email.trim();

    if (!fullName) {
      return "Full name is required.";
    }

    if (fullName.length < 2) {
      return "Full name must be at least 2 characters.";
    }

    if (phone && !/^\+?\d{7,15}$/.test(phone)) {
      return "Enter a valid phone number. Use 7 to 15 digits, with optional + at the start.";
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Enter a valid email address.";
    }

    if (!formData.startDate) {
      return "Start date is required.";
    }

    if (formData.startDate < today) {
      return "Start date cannot be earlier than today.";
    }

    if (
      formData.testDate &&
      formData.testDate < formData.startDate
    ) {
      return "Test date cannot be earlier than the start date.";
    }

    if (formData.notes.length > 1000) {
      return "Notes cannot be more than 1000 characters.";
    }

    return "";
  };

  // ==========================================
  // HANDLE GENERAL INPUT CHANGES
  // Updates the correct form field based on input name
  // ==========================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      // If the start date changes and the existing test date
      // becomes earlier than the new start date, clear test date.
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

  // ==========================================
  // HANDLE PHONE INPUT
  // Allows only digits and one optional + at the beginning
  // ==========================================
  const handlePhoneChange = (e) => {
    let value = e.target.value;

    // Remove everything except numbers and +
    value = value.replace(/[^\d+]/g, "");

    // Remove any + that is not at the beginning
    value = value.replace(/(?!^)\+/g, "");

    setFormData((prev) => ({
      ...prev,
      phone: value,
    }));
  };

  // ==========================================
  // SUBMIT FORM
  // Validates, cleans, and sends student data to backend
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Run frontend validation before sending to backend
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    // Clean payload before sending to API
    const payload = {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      startDate: formData.startDate,
      testDate: formData.testDate || null,
      notes: formData.notes.trim(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

          // Sends logged-in user's token so backend knows the instructor
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      // Safely parse both JSON and non-JSON backend responses
      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text || "Failed to create student" };
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to create student");
      }

      // Return user to dashboard after successful creation
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <div className="page">
      {/* Top navigation */}
      <div className="top-nav">
        <Link to="/dashboard">← Back to Dashboard</Link>
      </div>

      {/* Page heading */}
      <div className="page-header">
        <div>
          <h1 className="title">Add New Student</h1>
          <p className="subtitle">Create a new learner profile.</p>
        </div>
      </div>

      {/* Form card */}
      <div className="card" style={{ maxWidth: "700px" }}>
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Full name */}
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              maxLength="80"
              placeholder="e.g. John Smith"
            />
          </div>

          {/* Phone number */}
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="e.g. +447123456789"
              maxLength="16"
              inputMode="tel"
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              maxLength="120"
              placeholder="e.g. student@email.com"
            />
          </div>

          {/* Start date - required */}
          <div className="form-group">
            <label>Start Date *</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              min={today}
              required
            />
          </div>

          {/* Test date - optional */}
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

          {/* Notes */}
          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              maxLength="1000"
              placeholder="Optional notes about the student"
            />
          </div>

          {/* Actions */}
          <div className="actions">
            <button type="submit" className="button">
              Create Student
            </button>

            <Link to="/dashboard" className="button-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddStudent;