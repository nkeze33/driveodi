// Import Express and create a router
const express = require("express");
const router = express.Router();

// Import models used in this file
const SkillProgress = require("../models/SkillProgress");
const Student = require("../models/Student");

// Import auth middleware
const authMiddleware = require("../middleware/authMiddleware");

// Protect all skill routes below this line
router.use(authMiddleware);

/* =========================================================
   CREATE DEFAULT SKILL PROGRESS FOR A STUDENT
   POST /api/skills

   Creates a skill progress record only if:
   - the student exists
   - the student belongs to the logged-in instructor
   - a skill progress record does not already exist
   ========================================================= */
router.post("/", async (req, res) => {
  try {
    const { studentId } = req.body;

    // Check that the student exists and belongs to this instructor
    const studentExists = await Student.findOne({
      _id: studentId,
      instructorId: req.user._id,
    });

    if (!studentExists) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if this student already has a skill progress record
    const existingSkillProgress = await SkillProgress.findOne({
      studentId,
      instructorId: req.user._id,
    });

    if (existingSkillProgress) {
      return res
        .status(400)
        .json({ message: "Skill progress already exists for this student" });
    }

    // Create a new skill progress record with default values
    const skillProgress = new SkillProgress({
      studentId,
      instructorId: req.user._id,
    });

    const savedSkillProgress = await skillProgress.save();

    res.status(201).json(savedSkillProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================================================
   GET SKILL PROGRESS FOR A SPECIFIC STUDENT
   GET /api/skills/student/:studentId

   Returns skill progress if it belongs to:
   - the selected student
   - the logged-in instructor

   If no record exists yet, return a default structure
   instead of throwing an error.
   ========================================================= */
router.get("/student/:studentId", async (req, res) => {
  try {
    // Make sure the student belongs to this instructor
    const studentExists = await Student.findOne({
      _id: req.params.studentId,
      instructorId: req.user._id,
    });

    if (!studentExists) {
      return res.status(404).json({ message: "Student not found" });
    }

    let skillProgress = await SkillProgress.findOne({
      studentId: req.params.studentId,
      instructorId: req.user._id,
    });

    // If none exists yet, return a default object
    if (!skillProgress) {
      return res.json({
        studentId: req.params.studentId,
        instructorId: req.user._id,
        skills: {},
      });
    }

    res.json(skillProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================================================
   UPDATE SKILL PROGRESS FOR A SPECIFIC STUDENT
   PUT /api/skills/student/:studentId

   Updates if record exists
   Creates if record does not exist yet
   ========================================================= */
router.put("/student/:studentId", async (req, res) => {
  try {
    // Make sure the student belongs to this instructor
    const studentExists = await Student.findOne({
      _id: req.params.studentId,
      instructorId: req.user._id,
    });

    if (!studentExists) {
      return res.status(404).json({ message: "Student not found" });
    }

    const updatedSkillProgress = await SkillProgress.findOneAndUpdate(
      {
        studentId: req.params.studentId,
        instructorId: req.user._id,
      },
      {
        studentId: req.params.studentId,
        instructorId: req.user._id,
        skills: req.body.skills,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.json(updatedSkillProgress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export the router so server.js can use it
module.exports = router;