import React, { useState } from "react";
import { Link } from "react-router-dom";

function Register() {
  // ==================================================
  // API BASE URL
  // Uses live backend if REACT_APP_API_URL exists,
  // otherwise falls back to local backend.
  // ==================================================
  const API_BASE_URL =
    process.env.REACT_APP_API_URL || "http://localhost:5000";

  // ==================================================
  // FORM STATE
  // Stores all registration form values.
  // confirmPassword is only used on the frontend
  // and should NOT be saved in the database.
  // ==================================================
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
    country: "",
    agreedToTerms: false,
  });

  // ==================================================
  // UI STATE
  // Controls error messages, success messages,
  // and loading state while the form submits.
  // ==================================================
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ==================================================
  // HANDLE INPUT CHANGES
  // Handles normal text inputs and checkbox inputs.
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
  // Clears the form after successful registration.
  // ==================================================
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      city: "",
      country: "",
      agreedToTerms: false,
    });
  };

  // ==================================================
  // SAFELY READ API RESPONSE
  // Handles both JSON and plain text responses.
  // This prevents the app from crashing if the backend
  // returns plain text instead of JSON.
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
  // VALIDATE FORM BEFORE SUBMITTING
  // Stops bad data before it reaches the backend.
  // ==================================================
  const validateForm = () => {
    if (formData.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match.";
    }

    if (!formData.agreedToTerms) {
      return "You must agree to the Terms of Use and Privacy Policy.";
    }

    return "";
  };

  // ==================================================
  // SUBMIT REGISTRATION FORM
  // Sends registration data to the backend.
  // confirmPassword is removed before sending because
  // the backend does not need to store or process it.
  // ==================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
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

          {error && (
  <div className="error">
    {error}

    {error.includes("already exists") && (
      <div style={{ marginTop: "8px" }}>
        <Link to="/login">Go to Login</Link>
      </div>
    )}
  </div>
)}
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

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
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