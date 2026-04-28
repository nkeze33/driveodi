import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken, getUser, logout, updateUser } from "../utils/auth";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

// ==========================================
// OVERALL PROGRESS LABELS
// ==========================================
const progressLabels = {
  not_started: "Not Started",
  needs_work: "Needs Work",
  improving: "Improving",
  competent: "Competent",
  test_ready: "Test Ready",
};

function Dashboard() {
  // ==========================================
  // STATE
  // ==========================================
  const [students, setStudents] = useState([]);
  const [subscription, setSubscription] = useState("inactive");
  const [trialEndDate, setTrialEndDate] = useState(null);
  const [notice, setNotice] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  const navigate = useNavigate();
  const user = getUser();

  const locationText = [user?.city, user?.country].filter(Boolean).join(", ");

  // ==========================================
  // ACCESS RULE
  // Trialing and active users can use locked features.
  // ==========================================
  const hasAccess = subscription === "trialing" || subscription === "active";

  // ==========================================
  // GET DAYS LEFT IN TRIAL
  // Calculates remaining days from trialEndDate.
  // ==========================================
  const getDaysLeft = () => {
    if (!trialEndDate) return null;

    const now = new Date().getTime();
    const end = new Date(trialEndDate).getTime();
    const diff = end - now;

    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = getDaysLeft();

  // ==========================================
  // SUBSCRIPTION LABEL
  // This is what appears beside "Subscription:"
  // ==========================================
  const getSubscriptionLabel = () => {
    if (subscription === "trialing" && daysLeft !== null) {
      return `Trial subscription active for ${daysLeft} day(s)`;
    }

    if (subscription === "trialing") {
      return "Trial subscription active";
    }

    if (subscription === "active") {
      return "Full subscription active";
    }

    if (subscription === "past_due") {
      return "Payment failed — update billing";
    }

    if (subscription === "canceled") {
      return "Subscription canceled";
    }

    if (subscription === "unpaid") {
      return "Payment unpaid";
    }

    return "Inactive";
  };

  // ==========================================
  // LOAD CURRENT USER / BILLING STATE
  // Keeps dashboard in sync with backend.
  // ==========================================
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        setSubscription(res.data.subscriptionStatus || "inactive");
        setTrialEndDate(res.data.trialEndDate || null);

        // Keep local storage in sync with backend.
        updateUser(res.data);
      } catch (error) {
        console.error("Failed to fetch current user:", error);

        if (error.response?.status === 401) {
          logout();
          navigate("/login");
        }
      } finally {
        setLoadingUser(false);
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  // ==========================================
  // LOAD STUDENTS
  // ==========================================
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/students`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        if (res.status === 401) {
          logout();
          navigate("/login");
          return;
        }

        let data;
        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          throw new Error(text || "Failed to load students");
        }

        if (!res.ok) {
          throw new Error(data.message || "Failed to load students");
        }

        setStudents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load students:", err);
      }
    };

    fetchStudents();
  }, [navigate]);

  // ==========================================
  // LOGOUT
  // ==========================================
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ==========================================
  // BILLING BUTTON CLICK
  // ==========================================
  const handleBillingClick = () => {
    setNotice("");

    if (subscription === "active") {
      setNotice("Your full subscription is already active.");
      return;
    }

    navigate("/billing");
  };

  // ==========================================
  // BILLING BUTTON TEXT
  // ==========================================
  const getBillingButtonText = () => {
    if (subscription === "trialing") return "Upgrade Now";
    if (subscription === "active") return "Subscription Active";
    if (subscription === "past_due") return "Update Billing";
    if (subscription === "unpaid") return "Update Billing";
    return "Start Subscription";
  };

  // ==========================================
  // LOADING STATE
  // Prevents wrong subscription state flashing.
  // ==========================================
  if (loadingUser) {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: "center" }}>
          <h2>Loading dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="title">Dashboard</h1>

          <p className="subtitle">
            Welcome{user?.name ? `, ${user.name}` : ""}. Manage your students
            and lesson records.
          </p>

          {locationText && (
            <p className="subtitle" style={{ marginTop: "6px" }}>
              Location: {locationText}
            </p>
          )}

          <div style={{ marginTop: "10px" }}>
            <strong>Subscription:</strong> {getSubscriptionLabel()}
          </div>

          {subscription === "trialing" && daysLeft !== null && daysLeft <= 7 && (
            <div style={{ marginTop: "8px", fontWeight: "bold" }}>
              Your trial is ending soon. Add or confirm your payment method to
              continue without interruption.
            </div>
          )}

          {(subscription === "past_due" || subscription === "unpaid") && (
            <div style={{ marginTop: "8px", fontWeight: "bold" }}>
              Your payment needs attention. Please update your billing details
              to restore access.
            </div>
          )}

          {subscription === "canceled" && (
            <div style={{ marginTop: "8px", fontWeight: "bold" }}>
              Your subscription has been canceled. Start a new subscription to
              continue using Driveodi.
            </div>
          )}

          {notice && (
            <div style={{ marginTop: "10px", fontWeight: "bold" }}>
              {notice}
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="actions">
          {hasAccess ? (
            <Link to="/add-student" className="button">
              + Add Student
            </Link>
          ) : (
            <button
              className="button"
              onClick={() => navigate("/billing")}
              style={{
                background: "#999",
                cursor: "not-allowed",
              }}
              title="Start a subscription to unlock this feature"
            >
              🔒 Add Student
            </button>
          )}

          <button
            onClick={handleBillingClick}
            className="button"
            style={{
              marginLeft: "10px",
              background: subscription === "active" ? "#666" : undefined,
              cursor: subscription === "active" ? "default" : "pointer",
            }}
          >
            {getBillingButtonText()}
          </button>

          <button onClick={handleLogout} className="button-secondary">
            Logout
          </button>
        </div>
      </div>

      {/* TOTAL STUDENTS */}
      <div className="card">
        <h2>Total Students</h2>
        <h1 className="stat-number">{students.length}</h1>
      </div>

      {/* STUDENTS LIST */}
      <div className="card">
        <h2>Students</h2>

        {students.length === 0 ? (
          <p className="empty-text">No students yet.</p>
        ) : (
          students.map((student) => (
            <div key={student._id} className="student-list-item">
              <Link to={`/student/${student._id}`} className="student-name">
                {student.fullName}
              </Link>

              <span className="badge">
                {progressLabels[student.overallProgress] || "Not Started"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;