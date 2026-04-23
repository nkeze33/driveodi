import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken, getUser, logout, updateUser } from "../utils/auth";

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

  const locationText = [user?.city, user?.country]
    .filter(Boolean)
    .join(", ");

  // ==========================================
  // ACCESS RULE
  // Only trialing and active users can use
  // subscription-locked features
  // ==========================================
  const hasAccess =
    subscription === "trialing" || subscription === "active";

  // ==========================================
  // GET DAYS LEFT IN TRIAL
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
  // LOAD CURRENT USER / BILLING STATE
  // This runs when dashboard opens so UI always
  // reflects the latest subscription state
  // ==========================================
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        setSubscription(res.data.subscriptionStatus || "inactive");
        setTrialEndDate(res.data.trialEndDate || null);

        // Keep local storage in sync with backend
        updateUser(res.data);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // ==========================================
  // LOAD STUDENTS
  // ==========================================
  useEffect(() => {
    fetch("http://localhost:5000/api/students", {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          logout();
          navigate("/login");
          return null;
        }

        return res.json();
      })
      .then((data) => {
        if (data) {
          setStudents(data);
        }
      })
      .catch((err) => console.error(err));
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
      setNotice("Your subscription is already active.");
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
    return "Start Subscription";
  };

  // ==========================================
  // SUBSCRIPTION LABEL
  // ==========================================
  const getSubscriptionLabel = () => {
    if (subscription === "trialing") return "Free Trial";
    if (subscription === "active") return "Active";
    if (subscription === "past_due") return "Payment Due";
    if (subscription === "canceled") return "Canceled";
    if (subscription === "unpaid") return "Unpaid";
    return "Inactive";
  };

  // ==========================================
  // LOADING STATE
  // Prevents UI flicker / wrong state showing
  // briefly before auth/me finishes loading
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
            Welcome{user?.name ? `, ${user.name}` : ""}. Manage your students and lesson records.
          </p>

          {locationText && (
            <p className="subtitle" style={{ marginTop: "6px" }}>
              Location: {locationText}
            </p>
          )}

          <div style={{ marginTop: "10px" }}>
            <strong>Subscription:</strong> {getSubscriptionLabel()}
          </div>

          {subscription === "trialing" && daysLeft !== null && (
            <div style={{ marginTop: "8px", fontWeight: "bold" }}>
              Your trial ends in {daysLeft} day(s). A paid subscription will start automatically after it ends.
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