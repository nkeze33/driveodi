// ==========================================
// IMPORTS
// ==========================================
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const SkillProgress = require("../models/SkillProgress");
const Student = require("../models/Student");

const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// ALLOWED SKILLS
// Only these skill names can be saved.
// This prevents users from adding unwanted fields.
// ==========================================
const allowedSkillKeys = [
  "cockpitDrill",
  "movingOff",
  "stopping",
  "clutchControl",
  "steering",
  "mirrors",
  "signals",
  "junctions",
  "roundabouts",
  "pedestrianCrossings",
  "manoeuvres",
  "reversing",
  "parking",
  "hillStarts",
  "dualCarriageway",
  "independentDriving",
];

// ==========================================
// ALLOWED SKILL VALUES
// Only these progress values can be saved.
// ==========================================
const allowedSkillValues = [
  "not_started",
  "needs_work",
  "improving",
  "competent",
  "test_ready",
];

// ==========================================
// DEFAULT SKILLS
// Used when creating a new skill progress record.
// ==========================================
const defaultSkills = allowedSkillKeys.reduce((acc, skill) => {
  acc[skill] = "not_started";
  return acc;
}, {});

// ==========================================
// VALIDATION HELPERS
// ==========================================
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const validateAndCleanSkills = (skills) => {
  // Skills must be a plain object.
  if (!skills || typeof skills !== "object" || Array.isArray(skills)) {
    return { error: "Skills must be a valid object." };
  }

  const cleanedSkills = {};

  // Validate each submitted skill.
  for (const [skillKey, skillValue] of Object.entries(skills)) {
    if (!allowedSkillKeys.includes(skillKey)) {
      return { error: `Invalid skill name: ${skillKey}` };
    }

    if (!allowedSkillValues.includes(skillValue)) {
      return { error: `Invalid value for ${skillKey}.` };
    }

    cleanedSkills[skillKey] = skillValue;
  }

  // Merge submitted skills into defaults so all skills always exist.
  return {
    cleanedSkills: {
      ...defaultSkills,
      ...cleanedSkills,
    },
  };
};

// ==========================================
// PROTECT ALL SKILL ROUTES
// Every route below requires a valid JWT.
// ==========================================
router.use(authMiddleware);

/* =========================================================
   CREATE DEFAULT SKILL PROGRESS FOR A STUDENT
   POST /api/skills

   Creates a skill progress record only if:
   - studentId is valid
   - the student exists
   - the student belongs to the logged-in instructor
   - a skill progress record does not already exist
   ========================================================= */
router.post("/", async (req, res) => {
  try {
    const studentId = String(req.body.studentId || "").trim();

    // Validate MongoDB ObjectId before querying.
    if (!studentId || !isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    // Confirm the student belongs to this instructor.
    const studentExists = await Student.findOne({
      _id: studentId,
      instructorId: req.user._id,
    });

    if (!studentExists) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Prevent duplicate skill progress records.
    const existingSkillProgress = await SkillProgress.findOne({
      studentId,
      instructorId: req.user._id,
    });

    if (existingSkillProgress) {
      return res.status(400).json({
        message: "Skill progress already exists for this student.",
      });
    }

    // Create a new skill progress record with safe default values.
    const skillProgress = new SkillProgress({
      studentId,
      instructorId: req.user._id,
      skills: defaultSkills,
    });

    const savedSkillProgress = await skillProgress.save();

    return res.status(201).json(savedSkillProgress);
  } catch (error) {
    console.error("Create skill progress error:", error.message);

    return res.status(500).json({
      message: "Failed to create skill progress.",
    });
  }
});

/* =========================================================
   GET SKILL PROGRESS FOR A SPECIFIC STUDENT
   GET /api/skills/student/:studentId

   Returns skill progress if it belongs to:
   - the selected student
   - the logged-in instructor

   If no record exists yet, returns default skills.
   ========================================================= */
router.get("/student/:studentId", async (req, res) => {
  try {
    const studentId = String(req.params.studentId || "").trim();

    // Validate MongoDB ObjectId before querying.
    if (!studentId || !isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    // Confirm the student belongs to this instructor.
    const studentExists = await Student.findOne({
      _id: studentId,
      instructorId: req.user._id,
    });

    if (!studentExists) {
      return res.status(404).json({ message: "Student not found." });
    }

    const skillProgress = await SkillProgress.findOne({
      studentId,
      instructorId: req.user._id,
    });

    // Return default structure if no progress exists yet.
    if (!skillProgress) {
      return res.json({
        studentId,
        instructorId: req.user._id,
        skills: defaultSkills,
      });
    }

    // Ensure returned skills contain all expected keys.
    return res.json({
      ...skillProgress.toObject(),
      skills: {
        ...defaultSkills,
        ...(skillProgress.skills || {}),
      },
    });
  } catch (error) {
    console.error("Get skill progress error:", error.message);

    return res.status(500).json({
      message: "Failed to load skill progress.",
    });
  }
});

/* =========================================================
   UPDATE SKILL PROGRESS FOR A SPECIFIC STUDENT
   PUT /api/skills/student/:studentId

   Updates if record exists.
   Creates if record does not exist yet.
   Only allowed skill names and allowed values are accepted.
   ========================================================= */
router.put("/student/:studentId", async (req, res) => {
  try {
    const studentId = String(req.params.studentId || "").trim();

    // Validate MongoDB ObjectId before querying.
    if (!studentId || !isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    // Validate and clean incoming skills.
    const { cleanedSkills, error } = validateAndCleanSkills(req.body.skills);

    if (error) {
      return res.status(400).json({ message: error });
    }

    // Confirm the student belongs to this instructor.
    const studentExists = await Student.findOne({
      _id: studentId,
      instructorId: req.user._id,
    });

    if (!studentExists) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Update existing skill progress or create one safely.
    const updatedSkillProgress = await SkillProgress.findOneAndUpdate(
      {
        studentId,
        instructorId: req.user._id,
      },
      {
        studentId,
        instructorId: req.user._id,
        skills: cleanedSkills,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.json(updatedSkillProgress);
  } catch (error) {
    console.error("Update skill progress error:", error.message);

    return res.status(500).json({
      message: "Failed to update skill progress.",
    });
  }
});

module.exports = router;