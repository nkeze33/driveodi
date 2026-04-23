import React from "react";
import { useNavigate } from "react-router-dom";

function BillingCancel() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Payment Cancelled</h1>
        <p>No changes were made to your subscription.</p>

        <div style={styles.buttonRow}>
          <button
            style={styles.primaryBtn}
            onClick={() => navigate("/billing")}
          >
            Back to Billing
          </button>

          <button
            style={styles.secondaryBtn}
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
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
    textAlign: "center",
  },
  buttonRow: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  primaryBtn: {
    background: "#007bff",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  secondaryBtn: {
    background: "#6c757d",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default BillingCancel;