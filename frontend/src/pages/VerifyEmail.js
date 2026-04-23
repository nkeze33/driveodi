import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

function VerifyEmail() {
  // ==================================================
  // API BASE URL
  // ==================================================
  const API_BASE_URL = "http://localhost:5000";

  // ==================================================
  // URL PARAMS
  // Gets token from:
  // /verify-email?token=abc123
  // ==================================================
  const [searchParams] = useSearchParams();

  // ==================================================
  // UI STATE
  // ==================================================
  const [message, setMessage] = useState("Verifying your email...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
  // VERIFY EMAIL ON PAGE LOAD
  // ==================================================
  useEffect(() => {
    const token = searchParams.get("token");

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/verify-email?token=${token}`
        );

        const data = await parseResponse(response);

        if (!response.ok) {
          throw new Error(data.message || "Verification failed");
        }

        setMessage(data.message || "Email verified successfully.");
      } catch (err) {
        setError(err.message || "Verification failed");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setError("Invalid or missing verification token.");
      setLoading(false);
    }
  }, [searchParams]);

  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* LEFT BRAND PANEL */}
        <div className="auth-brand-panel">
          <p className="auth-brand-badge">Driveodi</p>
          <h1>Order in Driving Intelligence.</h1>
          <p>
            Verifying your account helps keep your instructor workspace secure
            and trusted.
          </p>
        </div>

        {/* RIGHT VERIFY CARD */}
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h2>Email Verification</h2>

          {loading && (
            <p className="auth-subtitle">
              Please wait while we verify your email...
            </p>
          )}

          {!loading && error && <div className="error">{error}</div>}
          {!loading && !error && <div className="success">{message}</div>}

          {!loading && (
            <div style={{ marginTop: "20px" }}>
              <Link to="/login" className="auth-submit-btn">
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;