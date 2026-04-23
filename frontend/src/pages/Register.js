import React, { useState } from "react";
import { Link } from "react-router-dom";

function Register() {
  // ==================================================
  // API BASE URL
  // ==================================================
  const API_BASE_URL = "http://localhost:5000";

  // ==================================================
  // FORM STATE
  // ==================================================
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    country: "",
    agreedToTerms: false,
  });

  // ==================================================
  // UI STATE
  // ==================================================
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ==================================================
  // HANDLE INPUT CHANGES
  // ==================================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ==================================================
  // RESET FORM
  // ==================================================
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      city: "",
      country: "",
      agreedToTerms: false,
    });
  };

  // ==================================================
  // SAFELY READ API RESPONSE
  // Handles both JSON and plain text responses
  // ==================================================
  const parseResponse = async (response) => {
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();
    return { message: text || "Request failed" };
  };

  // ==================================================
  // SUBMIT REGISTRATION FORM
  // ==================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setSuccess(
        data.message ||
          "Registration successful. Please check your email to verify your account before logging in."
      );

      resetForm();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* LEFT BRAND PANEL */}
        <div className="auth-brand-panel">
          <p className="auth-brand-badge">Driveodi</p>
          <h1>Order in Driving Intelligence.</h1>
          <p>
            A cleaner way for driving instructors to manage students, lessons,
            assessments, and progress.
          </p>
        </div>

        {/* RIGHT REGISTER CARD */}
        <div className="auth-card">
          <h2>Create your account</h2>
          <p className="auth-subtitle">
            Start your free trial and set up your instructor workspace.
          </p>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <form onSubmit={handleSubmit}>
            {/* Full name */}
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <small className="form-hint">
                Use at least 8 characters with uppercase, lowercase, number,
                and special character.
              </small>
            </div>

            {/* Location */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  id="country"
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Terms */}
            <div className="checkbox-group">
              <input
                id="agreedToTerms"
                type="checkbox"
                name="agreedToTerms"
                checked={formData.agreedToTerms}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="agreedToTerms">
                I agree to the <Link to="/terms">Terms of Use</Link> and{" "}
                <Link to="/privacy">Privacy Policy</Link>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="auth-switch-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;