const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const Lesson = require("../models/Lesson");
const SkillProgress = require("../models/SkillProgress");

const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// DATE VALIDATION HELPER
// ==========================================
const validateDates = (startDate, testDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate) {
    const start = new Date(startDate);
    if (start < today) {
      return "Start date cannot be in the past.";
    }
  }

  if (startDate && testDate) {
    const start = new Date(startDate);
    const test = new Date(testDate);

    if (test < start) {
      return "Test date cannot be earlier than the start date.";
    }
  }

  return null;
};

// Protect all routes
router.use(authMiddleware);

/* =========================================================
   CREATE A NEW STUDENT
   POST /api/students
   ========================================================= */
router.post("/", async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      startDate,
      testDate,
      notes,
      overallProgress,
    } = req.body;

    const dateError = validateDates(startDate, testDate);
    if (dateError) {
      return res.status(400).json({ message: dateError });
    }

    const student = new Student({
      instructorId: req.user._id,
      fullName,
      phone,
      email,
      startDate,
      testDate,
      notes,
      overallProgress,
    });

    const savedStudent = await student.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================================================
   GET ALL STUDENTS FOR LOGGED-IN INSTRUCTOR
   GET /api/students
   ========================================================= */
router.get("/", async (req, res) => {
  try {
    const students = await Student.find({
      instructorId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================================================
   GET FULL STUDENT PROFILE
   GET /api/students/:id/profile
   ========================================================= */
router.get("/:id/profile", async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      instructorId: req.user._id,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const lessons = await Lesson.find({
      studentId: req.params.id,
      instructorId: req.user._id,
    }).sort({ lessonDate: -1 });

    const skillProgress = await SkillProgress.findOne({
      studentId: req.params.id,
      instructorId: req.user._id,
    });

    res.json({
      student,
      lessons,
      skillProgress,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================================================
   GET SINGLE STUDENT
   GET /api/students/:id
   ========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      instructorId: req.user._id,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================================================
   UPDATE STUDENT
   PUT /api/students/:id
   ========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const { startDate, testDate } = req.body;

    const dateError = validateDates(startDate, testDate);
    if (dateError) {
      return res.status(400).json({ message: dateError });
    }

    const updatedStudent = await Student.findOneAndUpdate(
      {
        _id: req.params.id,
        instructorId: req.user._id,
      },
      req.body,
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================================================
   DELETE STUDENT
   DELETE /api/students/:id
   ========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const deletedStudent = await Student.findOneAndDelete({
      _id: req.params.id,
      instructorId: req.user._id,
    });

    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;