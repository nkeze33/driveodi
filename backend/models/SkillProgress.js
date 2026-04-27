const mongoose = require("mongoose");

// ==========================================
// SKILL LEVEL STRUCTURE
// Defines allowed values for each skill
// ==========================================
const level = {
  type: String,
  enum: [
    "not_started",
    "needs_work",
    "improving",
    "competent",
    "test_ready",
  ],
  default: "not_started",
};

// ==========================================
// DEFAULT SKILLS OBJECT
// Ensures all skills exist even if not set manually
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

// ==========================================
// SCHEMA
// ==========================================
const skillProgressSchema = new mongoose.Schema(
  {
    // Student this skill record belongs to
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // Instructor who owns this record
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Skill progress object
    skills: {
      cockpitDrill: level,
      movingOff: level,
      stopping: level,
      clutchControl: level,
      steering: level,
      mirrors: level,
      signals: level,
      junctions: level,
      roundabouts: level,
      pedestrianCrossings: level,
      manoeuvres: level,
      reversing: level,
      parking: level,
      hillStarts: level,
      dualCarriageway: level,
      independentDriving: level,
    },
  },
  {
    timestamps: true,
    minimize: false, // Prevent Mongo from removing empty objects
  }
);

// ==========================================
// COMPOUND UNIQUE INDEX
// Prevent duplicate records per instructor + student
// ==========================================
skillProgressSchema.index(
  { studentId: 1, instructorId: 1 },
  { unique: true }
);

// ==========================================
// PRE-SAVE HOOK
// Ensures skills always exist with defaults
// ==========================================
skillProgressSchema.pre("save", function (next) {
  if (!this.skills || Object.keys(this.skills).length === 0) {
    this.skills = defaultSkills;
  } else {
    this.skills = {
      ...defaultSkills,
      ...this.skills,
    };
  }

  next();
});

module.exports = mongoose.model("SkillProgress", skillProgressSchema);