const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const Lesson = require("../models/Lesson");
const SkillProgress = require("../models/SkillProgress");

const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// VALIDATION HELPERS
// ==========================================
const sanitizeText = (value) => {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim();
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone) => {
  return /^\+?\d{7,15}$/.test(phone);
};

const validateDates = (startDate, testDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate) {
    const start = new Date(startDate);

    if (Number.isNaN(start.getTime())) {
      return "Start date is invalid.";
    }

    if (start < today) {
      return "Start date cannot be in the past.";
    }
  }

  if (testDate) {
    const test = new Date(testDate);

    if (Number.isNaN(test.getTime())) {
      return "Test date is invalid.";
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

const validateAndCleanStudentInput = (body) => {
  const cleaned = {
    fullName: sanitizeText(body.fullName),
    phone: sanitizeText(body.phone),
    email: sanitizeText(body.email).toLowerCase(),
    startDate: body.startDate || null,
    testDate: body.testDate || null,
    notes: sanitizeText(body.notes),
    overallProgress: sanitizeText(body.overallProgress || "not_started"),
  };

  const allowedProgress = [
    "not_started",
    "needs_work",
    "improving",
    "competent",
    "test_ready",
  ];

  if (!cleaned.fullName) {
    return { error: "Full name is required." };
  }

  if (cleaned.fullName.length < 2 || cleaned.fullName.length > 80) {
    return { error: "Full name must be between 2 and 80 characters." };
  }

  if (cleaned.phone && !isValidPhone(cleaned.phone)) {
    return {
      error:
        "Invalid phone number. Use 7 to 15 digits, with optional + at the start.",
    };
  }

  if (cleaned.email && !isValidEmail(cleaned.email)) {
    return { error: "Invalid email address." };
  }

  if (cleaned.notes.length > 1000) {
    return { error: "Notes cannot be more than 1000 characters." };
  }

  if (!allowedProgress.includes(cleaned.overallProgress)) {
    return { error: "Invalid overall progress value." };
  }

  const dateError = validateDates(cleaned.startDate, cleaned.testDate);

  if (dateError) {
    return { error: dateError };
  }

  return { cleaned };
};

// Protect all routes
router.use(authMiddleware);

/* =========================================================
   CREATE A NEW STUDENT
   POST /api/students
   ========================================================= */
router.post("/", async (req, res) => {
  try {
    const { cleaned, error } = validateAndCleanStudentInput(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const student = new Student({
      instructorId: req.user._id,
      fullName: cleaned.fullName,
      phone: cleaned.phone,
      email: cleaned.email,
      startDate: cleaned.startDate,
      testDate: cleaned.testDate,
      notes: cleaned.notes,
      overallProgress: cleaned.overallProgress,
    });

    const savedStudent = await student.save();

    return res.status(201).json(savedStudent);
  } catch (error) {
    console.error("Create student error:", error.message);

    return res.status(500).json({
      message: "Failed to create student.",
    });
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

    return res.json(students);
  } catch (error) {
    console.error("Get students error:", error.message);

    return res.status(500).json({
      message: "Failed to load students.",
    });
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

    return res.json({
      student,
      lessons,
      skillProgress,
    });
  } catch (error) {
    console.error("Get student profile error:", error.message);

    return res.status(500).json({
      message: "Failed to load student profile.",
    });
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

    return res.json(student);
  } catch (error) {
    console.error("Get student error:", error.message);

    return res.status(500).json({
      message: "Failed to load student.",
    });
  }
});

/* =========================================================
   UPDATE STUDENT
   PUT /api/students/:id
   ========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const { cleaned, error } = validateAndCleanStudentInput(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const updatedStudent = await Student.findOneAndUpdate(
      {
        _id: req.params.id,
        instructorId: req.user._id,
      },
      {
        fullName: cleaned.fullName,
        phone: cleaned.phone,
        email: cleaned.email,
        startDate: cleaned.startDate,
        testDate: cleaned.testDate,
        notes: cleaned.notes,
        overallProgress: cleaned.overallProgress,
      },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.json(updatedStudent);
  } catch (error) {
    console.error("Update student error:", error.message);

    return res.status(500).json({
      message: "Failed to update student.",
    });
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

    return res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Delete student error:", error.message);

    return res.status(500).json({
      message: "Failed to delete student.",
    });
  }
});

module.exports = router;