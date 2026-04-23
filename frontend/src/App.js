import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import StudentProfile from "./pages/StudentProfile";
import AddStudent from "./pages/AddStudent";
import AddLesson from "./pages/AddLesson";
import UpdateSkills from "./pages/UpdateSkills";
import EditStudent from "./pages/EditStudent";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import BillingPage from "./pages/BillingPage";
import BillingSuccess from "./pages/BillingSuccess";
import BillingCancel from "./pages/BillingCancel";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

import ProtectedRoute from "./components/ProtectedRoute";
import { isAuthenticated } from "./utils/auth";

function App() {
  return (
    <Router>
      <Routes>
        {/* =========================================
            PUBLIC ROUTES
        ========================================= */}

        {/* Landing / Home Page */}
        <Route path="/" element={<Home />} />

        {/* Terms and Privacy */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Email Verification Page */}
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />

        <Route
          path="/register"
          element={
            isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Register />
          }
        />

        {/* =========================================
            PROTECTED ROUTES
        ========================================= */}

        {/* Main Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/:id"
          element={
            <ProtectedRoute>
              <StudentProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-student"
          element={
            <ProtectedRoute>
              <AddStudent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/:id/add-lesson"
          element={
            <ProtectedRoute>
              <AddLesson />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/:id/update-skills"
          element={
            <ProtectedRoute>
              <UpdateSkills />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/:id/edit"
          element={
            <ProtectedRoute>
              <EditStudent />
            </ProtectedRoute>
          }
        />

        {/* Billing Routes */}
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <BillingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/billing/success"
          element={
            <ProtectedRoute>
              <BillingSuccess />
            </ProtectedRoute>
          }
        />

        <Route
          path="/billing/cancel"
          element={
            <ProtectedRoute>
              <BillingCancel />
            </ProtectedRoute>
          }
        />

        {/* =========================================
            FALLBACK ROUTE
        ========================================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;