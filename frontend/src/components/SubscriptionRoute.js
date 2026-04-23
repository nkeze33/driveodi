import React from "react";
import { Navigate } from "react-router-dom";
import { getUser } from "../utils/auth";

function SubscriptionRoute({ children }) {
  const user = getUser();

  const hasAccess =
    user?.subscriptionStatus === "trialing" ||
    user?.subscriptionStatus === "active";

  if (!hasAccess) {
    return <Navigate to="/billing" replace />;
  }

  return children;
}

export default SubscriptionRoute;