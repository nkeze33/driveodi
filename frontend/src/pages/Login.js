import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { saveAuth } from "../utils/auth";

function Login() {
  // ==================================================
  // API BASE URL
  // Uses local backend for now.
  // Later, replace with environment variable.
  // ==================================================
  const API_BASE_URL = "http://localhost:5000";

  const navigate = useNavigate();
  const location = useLocation();

  // ==================================================
  // If user was redirected here from a protected page,
  // send them back there after successful login.
  // Otherwise, go to dashboard.
  // ==================================================
  const from = location.state?.from?.pathname || "/dashboard";

  // ==================================================
  // FORM STATE
  // ==================================================
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // ==================================================
  // UI STATE
  // ==================================================
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // ==================================================
  // HANDLE INPUT CHANGES
  // ==================================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
  // RESEND VERIFICATION EMAIL
  // ==================================================
  const handleResendVerification = async () => {
    setError("");
    setInfo("");
    setResending(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: formData.email }),
        }
      );

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.message || "Could not resend verification email"
        );
      }

      setInfo(
        data.message || "Verification email sent. Please check your inbox."
      );
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setResending(false);
    }
  };

  // ==================================================
  // SUBMIT LOGIN FORM
  // ==================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setInfo("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // ----------------------------------------------
      // Ensure subscription fields always exist
      // ----------------------------------------------
      const userWithSubscription = {
        ...data.user,
        subscriptionStatus: data.user?.subscriptionStatus || "inactive",
        isSubscriptionActive: data.user?.isSubscriptionActive || false,
        trialEndDate: data.user?.trialEndDate || null,
      };

      // ----------------------------------------------
      // Save token and user details locally
      // ----------------------------------------------
      saveAuth(data.token, userWithSubscription);

      // ----------------------------------------------
      // Redirect to intended page or dashboard
      // ----------------------------------------------
      navigate(from, { replace: true });
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
            Sign in to manage students, track lessons, review assessments,
            and keep your driving instruction more organised.
          </p>
        </div>

        {/* RIGHT LOGIN CARD */}
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="auth-subtitle">
            Sign in to your instructor account.
          </p>

          {error && <div className="error">{error}</div>}
          {info && <div className="success">{info}</div>}

          <form onSubmit={handleSubmit}>
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
                disabled={loading || resending}
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
                disabled={loading || resending}
              />
            </div>

            {/* Login button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || resending}
            >
              {loading ? "Signing In..." : "Login"}
            </button>

            {/* Resend verification button */}
            <button
              type="button"
              className="auth-secondary-btn"
              onClick={handleResendVerification}
              disabled={resending || loading || !formData.email}
            >
              {resending ? "Sending..." : "Resend Verification Email"}
            </button>
          </form>

          <div className="auth-links-row">
            <p className="auth-switch-text">
              Don’t have an account? <Link to="/register">Register</Link>
            </p>

            <p className="auth-helper-text">
              By continuing, you agree to our <Link to="/terms">Terms</Link> and{" "}
              <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;