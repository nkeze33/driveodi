const mongoose = require("mongoose");

const level = {
  type: String,
  enum: ["not_started", "needs_work", "improving", "competent", "test_ready"],
  default: "not_started",
};

const skillProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
  { timestamps: true }
);

module.exports = mongoose.model("SkillProgress", skillProgressSchema);