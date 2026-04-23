import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

function ProtectedRoute({ children }) {
  const location = useLocation();

  // ==========================================
  // If user is NOT authenticated
  // Redirect them to login page
  // and remember where they were trying to go
  // ==========================================
  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }} // 🔥 important upgrade
      />
    );
  }

  // ==========================================
  // If authenticated → allow access
  // ==========================================
  return children;
}

export default ProtectedRoute;