import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="landing-page">
      {/* =========================================
          HEADER
      ========================================= */}
      <header className="landing-header">
        <div className="logo">Driveodi</div>

        <div className="nav-actions">
          {/* Subtle login link (does not compete) */}
          <Link to="/login" className="nav-login-link">
            Login
          </Link>

          {/* Primary CTA */}
          <Link to="/register" className="nav-btn primary">
            Start Free Trial
          </Link>
        </div>
      </header>

      {/* =========================================
          HERO SECTION (NO BUTTONS)
      ========================================= */}
      <section className="hero">
        <h1>Order in Driving Intelligence.</h1>

        <p>
          A cleaner way for driving instructors to manage students, track lessons,
          and monitor progress — without the paperwork.
        </p>

        <p className="hero-hint">Scroll to explore ↓</p>
      </section>

      {/* =========================================
          SIMPLE FEATURES SECTION
      ========================================= */}
      <section className="features">
        <div className="feature">
          <h3>Track Every Student</h3>
          <p>Keep all student records organised in one place.</p>
        </div>

        <div className="feature">
          <h3>Monitor Progress</h3>
          <p>See exactly what each student needs to improve.</p>
        </div>

        <div className="feature">
          <h3>Stay in Control</h3>
          <p>Know what’s working and what’s not instantly.</p>
        </div>
      </section>

      {/* =========================================
          FOOTER (LOGIN BACKUP)
      ========================================= */}
      <footer className="landing-footer">
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </footer>
    </div>
  );
}

export default Home;