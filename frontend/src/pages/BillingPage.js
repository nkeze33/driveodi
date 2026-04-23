import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken, updateUser } from "../utils/auth";

function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("inactive");
  const [trialEndDate, setTrialEndDate] = useState(null);
  const [message, setMessage] = useState("");

  // ==========================================
  // LOAD BILLING STATE
  // ==========================================
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
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

  // ==========================================
  // GET TRIAL DAYS LEFT
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
  // START FREE TRIAL
  // Sends startWithTrial: true
  // ==========================================
  const handleStartTrial = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(
        "http://localhost:5000/api/billing/create-checkout-session",
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

  // ==========================================
  // START PAID SUBSCRIPTION IMMEDIATELY
  // Sends startWithTrial: false
  // ==========================================
  const handleStartPaidSubscription = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(
        "http://localhost:5000/api/billing/create-checkout-session",
        { startWithTrial: false },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      window.location.href = res.data.url;
    } catch (error) {
      console.error("Start paid subscription error:", error.response?.data || error.message);
      setMessage(
        error.response?.data?.message || "Failed to start paid subscription."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UPGRADE NOW
  // Ends trial immediately and attempts payment
  // ==========================================
  const handleUpgradeNow = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(
        "http://localhost:5000/api/billing/upgrade-now",
        {},
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      setMessage(res.data.message || "Payment is being processed.");

      // Refresh billing state after webhook has time to update DB
      setTimeout(async () => {
        try {
          const fresh = await axios.get("http://localhost:5000/api/auth/me", {
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

  // ==========================================
  // ACTIVE STATE MESSAGE
  // ==========================================
  if (subscriptionStatus === "active") {
    return (
      <div style={styles.container}>
        <h1>Billing</h1>
        <div style={styles.card}>
          <h2>Subscription Active</h2>
          <p>Your account is already on an active paid subscription.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>Billing</h1>

      {message && <p style={styles.message}>{message}</p>}

      {/* INACTIVE / FAILED / CANCELED */}
      {(subscriptionStatus === "inactive" ||
        subscriptionStatus === "canceled" ||
        subscriptionStatus === "past_due" ||
        subscriptionStatus === "unpaid") && (
        <div style={styles.card}>
          <h2>Choose Subscription Option</h2>
          <p>
            You can either start a 30-day free trial or start a paid subscription immediately.
          </p>

          <div style={styles.buttonRow}>
            <button
              style={styles.primaryBtn}
              onClick={handleStartTrial}
              disabled={loading}
            >
              {loading ? "Loading..." : "Start Free Trial"}
            </button>

            <button
              style={styles.secondaryBtn}
              onClick={handleStartPaidSubscription}
              disabled={loading}
            >
              {loading ? "Loading..." : "Start Paid Subscription"}
            </button>
          </div>
        </div>
      )}

      {/* TRIALING */}
      {subscriptionStatus === "trialing" && (
        <div style={styles.card}>
          <h2>Free Trial</h2>
          <p>
            Your trial ends in <strong>{daysLeft}</strong> day(s).
          </p>
          <p>
            A paid subscription will begin automatically after the trial ends.
            If you want to move to paid immediately, click below.
          </p>

          <button
            style={styles.primaryBtn}
            onClick={handleUpgradeNow}
            disabled={loading}
          >
            {loading ? "Processing..." : "Upgrade Now"}
          </button>
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
  },
  primaryBtn: {
    background: "#28a745",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  secondaryBtn: {
    background: "#007bff",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  message: {
    marginBottom: "16px",
    fontWeight: "bold",
  },
};

export default BillingPage;