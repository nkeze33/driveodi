import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

// ==========================================
// SKILL LABELS
// ==========================================
const skillLabels = {
  cockpitDrill: "Cockpit Drill",
  movingOff: "Moving Off",
  stopping: "Stopping",
  clutchControl: "Clutch Control",
  steering: "Steering",
  mirrors: "Mirrors",
  signals: "Signals",
  junctions: "Junctions",
  roundabouts: "Roundabouts",
  pedestrianCrossings: "Pedestrian Crossings",
  manoeuvres: "Manoeuvres",
  reversing: "Reversing",
  parking: "Parking",
  hillStarts: "Hill Starts",
  dualCarriageway: "Dual Carriageway",
  independentDriving: "Independent Driving",
};

// ==========================================
// DEFAULT SKILLS
// Ensures the form always shows all skills
// even if backend returns an empty object
// ==========================================
const defaultSkills = {
  cockpitDrill: "not_started",
  movingOff: "not_started",
  stopping: "not_started",
  clutchControl: "not_started",
  steering: "not_started",
  mirrors: "not_started",
  signals: "not_started",
  junctions: "not_started",
  roundabouts: "not_started",
  pedestrianCrossings: "not_started",
  manoeuvres: "not_started",
  reversing: "not_started",
  parking: "not_started",
  hillStarts: "not_started",
  dualCarriageway: "not_started",
  independentDriving: "not_started",
};

function UpdateSkills() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Start with all skills visible by default
  const [skills, setSkills] = useState(defaultSkills);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD SKILLS
  // ==========================================
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/skills/student/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (res.status === 401) {
          navigate("/login");
          return;
        }

        let data;
        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          data = { message: text || "Failed to load skills" };
        }

        if (!res.ok) {
          throw new Error(data.message || "Failed to load skills");
        }

        if (data && data.skills) {
          // Merge existing backend data into defaults
          setSkills({
            ...defaultSkills,
            ...data.skills,
          });
        } else {
          // If no skills returned, still show default form
          setSkills(defaultSkills);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load skills");
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, [id, navigate]);

  // ==========================================
  // HANDLE SKILL CHANGE
  // ==========================================
  const handleChange = (skill, value) => {
    setSkills((prev) => ({
      ...prev,
      [skill]: value,
    }));
  };

  // ==========================================
  // SAVE UPDATED SKILLS
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/skills/student/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ skills }),
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text || "Failed to update skills" };
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to update skills");
      }

      navigate(`/student/${id}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    }
  };

  if (loading) {
    return <p className="page">Loading skills...</p>;
  }

  return (
    <div className="page">
      {/* Top navigation */}
      <div className="top-nav">
        <Link to={`/student/${id}`}>← Back to Student Profile</Link>
      </div>

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="title">Update Skills</h1>
          <p className="subtitle">Edit the student’s driving skill progress.</p>
        </div>
      </div>

      {/* Main form card */}
      <div className="card" style={{ maxWidth: "700px" }}>
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Loop through all skills */}
          {Object.entries(skills).map(([skill, value]) => (
            <div key={skill} className="form-group">
              <label>{skillLabels[skill] || skill}</label>

              <select
                value={value}
                onChange={(e) => handleChange(skill, e.target.value)}
              >
                <option value="not_started">Not Started</option>
                <option value="needs_work">Needs Work</option>
                <option value="improving">Improving</option>
                <option value="competent">Competent</option>
                <option value="test_ready">Test Ready</option>
              </select>
            </div>
          ))}

          {/* Action buttons */}
          <div className="actions">
            <button type="submit" className="button">
              Save Skills
            </button>

            <Link to={`/student/${id}`} className="button-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdateSkills;