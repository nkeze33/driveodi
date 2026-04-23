import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken, updateUser } from "../utils/auth";

function BillingSuccess() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Confirming your subscription...");

  useEffect(() => {
    const refreshUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });

        updateUser(res.data);

        if (res.data.subscriptionStatus === "active") {
          setMessage("Your subscription is now active.");
        } else if (res.data.subscriptionStatus === "trialing") {
          setMessage("Your free trial has started successfully.");
        } else {
          setMessage("Payment completed.");
        }

        // Go back immediately after syncing user
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Billing success refresh failed:", error);
        setMessage("Payment completed. Please return to dashboard.");
      }
    };

    refreshUser();
  }, [navigate]);

  return (
    <div className="page">
      <div
        className="card"
        style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center" }}
      >
        <h1 className="title">Success</h1>
        <p className="subtitle">{message}</p>

        <button
          className="button"
          onClick={() => navigate("/", { replace: true })}
          style={{ marginTop: "20px" }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

export default BillingSuccess;