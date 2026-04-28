import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getToken, updateUser } from "../utils/auth";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("inactive");
  const [trialEndDate, setTrialEndDate] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        setSubscriptionStatus(res.data.subscriptionStatus || "inactive");
        setTrialEndDate(res.data.trialEndDate || null);
        updateUser(res.data);
      } catch (error) {
        console.error("Failed to load billing state:", error);
        setMessage("Failed to load billing information.");
      }
    };

    fetchUser();
  }, []);

  const getDaysLeft = () => {
    if (!trialEndDate) return null;

    const now = new Date().getTime();
    const end = new Date(trialEndDate).getTime();
    const diff = end - now;

    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = getDaysLeft();

  const handleStartTrial = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(
        `${API_BASE_URL}/api/billing/create-checkout-session`,
        { startWithTrial: true },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      window.location.href = res.data.url;
    } catch (error) {
      console.error("Start trial error:", error.response?.data || error.message);
      setMessage(error.response?.data?.message || "Failed to start free trial.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartPaidSubscription = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(
        `${API_BASE_URL}/api/billing/create-checkout-session`,
        { startWithTrial: false },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      window.location.href = res.data.url;
    } catch (error) {
      console.error(
        "Start paid subscription error:",
        error.response?.data || error.message
      );
      setMessage(
        error.response?.data?.message || "Failed to start paid subscription."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeNow = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(
        `${API_BASE_URL}/api/billing/upgrade-now`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      setMessage(res.data.message || "Payment is being processed.");

      setTimeout(async () => {
        try {
          const fresh = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          });

          setSubscriptionStatus(fresh.data.subscriptionStatus || "inactive");
          setTrialEndDate(fresh.data.trialEndDate || null);
          updateUser(fresh.data);
        } catch (refreshError) {
          console.error("Failed to refresh billing state:", refreshError);
        }
      }, 3000);
    } catch (error) {
      console.error("Upgrade now error:", error.response?.data || error.message);
      setMessage(error.response?.data?.message || "Failed to upgrade now.");
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(
        `${API_BASE_URL}/api/billing/create-portal-session`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      window.location.href = res.data.url;
    } catch (error) {
      console.error(
        "Manage billing error:",
        error.response?.data || error.message
      );
      setMessage(error.response?.data?.message || "Failed to open billing.");
    } finally {
      setLoading(false);
    }
  };

  if (subscriptionStatus === "active") {
    return (
      <div style={styles.container}>
        <h1>Billing</h1>

        <div style={styles.card}>
          <h2>Subscription Active</h2>
          <p>Your account is already on an active paid subscription.</p>

          <div style={styles.buttonRow}>
            <Link to="/dashboard" style={styles.linkButton}>
              ← Back to Dashboard
            </Link>

            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={handleManageBilling}
              disabled={loading}
            >
              {loading ? "Loading..." : "Manage Billing"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>Billing</h1>

      {message && <p style={styles.message}>{message}</p>}

      {(subscriptionStatus === "inactive" ||
        subscriptionStatus === "canceled" ||
        subscriptionStatus === "past_due" ||
        subscriptionStatus === "unpaid") && (
        <div style={styles.card}>
          <h2>Choose Subscription Option</h2>
          <p>
            You can either start a 30-day free trial or start a paid
            subscription immediately.
          </p>

          <div style={styles.buttonRow}>
            <button
              type="button"
              style={styles.primaryBtn}
              onClick={handleStartTrial}
              disabled={loading}
            >
              {loading ? "Loading..." : "Start Free Trial"}
            </button>

            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={handleStartPaidSubscription}
              disabled={loading}
            >
              {loading ? "Loading..." : "Start Paid Subscription"}
            </button>

            <Link to="/dashboard" style={styles.linkButton}>
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {subscriptionStatus === "trialing" && (
        <div style={styles.card}>
          <h2>Free Trial Active</h2>

          <p>
            Your trial ends in <strong>{daysLeft}</strong> day(s).
          </p>

          <p>
            A paid subscription will begin automatically after the trial ends. If
            you want to move to paid immediately, click below.
          </p>

          <div style={styles.buttonRow}>
            <button
              type="button"
              style={styles.primaryBtn}
              onClick={handleUpgradeNow}
              disabled={loading}
            >
              {loading ? "Processing..." : "Upgrade Now"}
            </button>

            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={handleManageBilling}
              disabled={loading}
            >
              {loading ? "Loading..." : "Manage Billing"}
            </button>

            <Link to="/dashboard" style={styles.linkButton}>
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    maxWidth: "700px",
    margin: "0 auto",
  },
  card: {
    background: "#111",
    color: "#fff",
    padding: "24px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  buttonRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "20px",
  },
  primaryBtn: {
    background: "#28a745",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  secondaryBtn: {
    background: "#007bff",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  linkButton: {
    display: "inline-block",
    background: "#fff",
    color: "#111",
    textDecoration: "none",
    padding: "12px 20px",
    borderRadius: "6px",
    fontWeight: "bold",
  },
  message: {
    marginBottom: "16px",
    fontWeight: "bold",
  },
};

export default BillingPage;