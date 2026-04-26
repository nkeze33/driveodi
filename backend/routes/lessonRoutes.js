// ==========================================
// IMPORTS
// ==========================================
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Lesson = require("../models/Lesson");
const Student = require("../models/Student");

const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// VALIDATION HELPERS
// ==========================================

// Removes risky angle brackets from text fields.
// This helps reduce stored script injection attempts.
const sanitizeText = (value) => {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim();
};

// Checks if a value is a valid MongoDB ObjectId.
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Checks if a date string is valid.
const isValidDate = (date) => {
  const parsedDate = new Date(date);
  return !Number.isNaN(parsedDate.getTime());
};

// ==========================================
// CLEAN + VALIDATE LESSON INPUT
// ==========================================
const validateAndCleanLessonInput = (body) => {
  const cleaned = {
    studentId: sanitizeText(body.studentId),
    lessonDate: body.lessonDate || null,
    durationMinutes: Number(body.durationMinutes),
    lessonRating:
      body.lessonRating === "" || body.lessonRating === undefined
        ? null
        : Number(body.lessonRating),
    notes: sanitizeText(body.notes),
    nextLessonFocus: sanitizeText(body.nextLessonFocus),
    topicsCovered: Array.isArray(body.topicsCovered)
      ? body.topicsCovered.map(sanitizeText).filter(Boolean)
      : [],
  };

  // Student ID is required because every lesson must belong to a student.
  if (!cleaned.studentId) {
    return { error: "Student ID is required." };
  }

  if (!isValidObjectId(cleaned.studentId)) {
    return { error: "Invalid student ID." };
  }

  // Lesson date is required so lesson records are meaningful.
  if (!cleaned.lessonDate) {
    return { error: "Lesson date is required." };
  }

  if (!isValidDate(cleaned.lessonDate)) {
    return { error: "Lesson date is invalid." };
  }

  // Duration must be a sensible positive number.
  if (
    !Number.isFinite(cleaned.durationMinutes) ||
    cleaned.durationMinutes < 1 ||
    cleaned.durationMinutes > 300
  ) {
    return {
      error: "Lesson duration must be between 1 and 300 minutes.",
    };
  }

  // Rating is optional, but if present it must be between 1 and 5.
  if (
    cleaned.lessonRating !== null &&
    (!Number.isFinite(cleaned.lessonRating) ||
      cleaned.lessonRating < 1 ||
      cleaned.lessonRating > 5)
  ) {
    return {
      error: "Lesson rating must be between 1 and 5.",
    };
  }

  if (cleaned.notes.length > 1000) {
    return { error: "Notes cannot be more than 1000 characters." };
  }

  if (cleaned.nextLessonFocus.length > 200) {
    return { error: "Next lesson focus cannot be more than 200 characters." };
  }

  if (cleaned.topicsCovered.length > 20) {
    return { error: "You cannot add more than 20 topics covered." };
  }

  const topicTooLong = cleaned.topicsCovered.some((topic) => topic.length > 80);

  if (topicTooLong) {
    return { error: "Each topic covered must be 80 characters or fewer." };
  }

  return { cleaned };
};

// ==========================================
// PROTECT ALL LESSON ROUTES
// Every route below requires a valid JWT token.
// ==========================================
router.use(authMiddleware);

/* =========================================================
   CREATE A NEW LESSON FOR A STUDENT
   POST /api/lessons

   This creates a lesson only if:
   - the request data is valid
   - the student exists
   - the student belongs to the logged-in instructor
   ========================================================= */
router.post("/", async (req, res) => {
  try {
    // Validate and clean all incoming lesson data.
    const { cleaned, error } = validateAndCleanLessonInput(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    // Check that the student exists AND belongs to this instructor.
    // This prevents one instructor adding lessons to another instructor's student.
    const studentExists = await Student.findOne({
      _id: cleaned.studentId,
      instructorId: req.user._id,
    });

    if (!studentExists) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Create the lesson and attach it to the logged-in instructor.
    const lesson = new Lesson({
      studentId: cleaned.studentId,
      instructorId: req.user._id,
      lessonDate: cleaned.lessonDate,
      durationMinutes: cleaned.durationMinutes,
      topicsCovered: cleaned.topicsCovered,
      lessonRating: cleaned.lessonRating,
      notes: cleaned.notes,
      nextLessonFocus: cleaned.nextLessonFocus,
    });

    const savedLesson = await lesson.save();

    return res.status(201).json(savedLesson);
  } catch (error) {
    console.error("Create lesson error:", error.message);

    return res.status(500).json({
      message: "Failed to create lesson.",
    });
  }
});

/* =========================================================
   GET ALL LESSONS FOR A SPECIFIC STUDENT
   GET /api/lessons/student/:studentId

   Only returns lessons that belong to:
   - the selected student
   - the logged-in instructor
   ========================================================= */
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validate student ID before querying MongoDB.
    if (!isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    // Confirm the student belongs to the logged-in instructor.
    const studentExists = await Student.findOne({
      _id: studentId,
      instructorId: req.user._id,
    });

    if (!studentExists) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Return only lessons owned by the logged-in instructor.
    const lessons = await Lesson.find({
      studentId,
      instructorId: req.user._id,
    }).sort({ lessonDate: -1 });

    return res.json(lessons);
  } catch (error) {
    console.error("Get lessons error:", error.message);

    return res.status(500).json({
      message: "Failed to load lessons.",
    });
  }
});

module.exports = router;