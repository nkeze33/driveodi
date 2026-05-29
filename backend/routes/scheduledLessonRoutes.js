const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const ScheduledLesson = require("../models/ScheduledLesson");
const Student = require("../models/Student");

const authMiddleware = require("../middleware/authMiddleware");

// Protect all scheduled lesson routes
router.use(authMiddleware);

// Block create/update/delete for expired users
const requireActiveSubscription = (req, res, next) => {
  if (!req.user.isSubscriptionActive) {
    return res.status(403).json({
      message:
        "Your free trial has expired. Please subscribe to continue using DriveODI.",
    });
  }

  next();
};

const sanitizeText = (value) => {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim();
};

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const isValidTime = (time) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// =========================================================
// CREATE SCHEDULED LESSON
// POST /api/scheduled-lessons
// =========================================================
router.post("/", requireActiveSubscription, async (req, res) => {
  try {
    const studentId = sanitizeText(req.body.studentId);
    const lessonDate = req.body.lessonDate || null;
    const lessonTime = sanitizeText(req.body.lessonTime);
    const durationMinutes = Number(req.body.durationMinutes || 120);
    const notes = sanitizeText(req.body.notes);

    if (!studentId || !isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    if (!lessonDate || Number.isNaN(new Date(lessonDate).getTime())) {
      return res.status(400).json({ message: "Lesson date is invalid." });
    }

    const cleanDate = new Date(lessonDate);
    cleanDate.setHours(0, 0, 0, 0);

    if (cleanDate < startOfToday()) {
      return res.status(400).json({
        message: "Scheduled lesson date cannot be in the past.",
      });
    }

    if (!lessonTime || !isValidTime(lessonTime)) {
      return res.status(400).json({
        message: "Lesson time must be in HH:MM format.",
      });
    }

    if (
      !Number.isFinite(durationMinutes) ||
      durationMinutes < 30 ||
      durationMinutes > 300
    ) {
      return res.status(400).json({
        message: "Duration must be between 30 and 300 minutes.",
      });
    }

    if (notes.length > 500) {
      return res.status(400).json({
        message: "Notes cannot be more than 500 characters.",
      });
    }

    const studentExists = await Student.findOne({
      _id: studentId,
      instructorId: req.user._id,
    });

    if (!studentExists) {
      return res.status(404).json({ message: "Student not found." });
    }

    const scheduledLesson = new ScheduledLesson({
      studentId,
      instructorId: req.user._id,
      lessonDate: cleanDate,
      lessonTime,
      durationMinutes,
      notes,
      status: "scheduled",
    });

    const savedLesson = await scheduledLesson.save();

    await savedLesson.populate("studentId", "fullName");

    return res.status(201).json(savedLesson);
  } catch (error) {
    console.error("Create scheduled lesson error:", error.message);

    return res.status(500).json({
      message: "Failed to schedule lesson.",
    });
  }
});

// =========================================================
// GET UPCOMING SCHEDULED LESSONS
// GET /api/scheduled-lessons/upcoming
// =========================================================
router.get("/upcoming", async (req, res) => {
  try {
    const today = startOfToday();

    const lessons = await ScheduledLesson.find({
      instructorId: req.user._id,
      status: "scheduled",
      lessonDate: { $gte: today },
    })
      .populate("studentId", "fullName")
      .sort({ lessonDate: 1, lessonTime: 1 })
      .limit(10);

    return res.json(lessons);
  } catch (error) {
    console.error("Get upcoming scheduled lessons error:", error.message);

    return res.status(500).json({
      message: "Failed to load upcoming scheduled lessons.",
    });
  }
});

// =========================================================
// GET SCHEDULED LESSONS FOR ONE STUDENT
// GET /api/scheduled-lessons/student/:studentId
// =========================================================
router.get("/student/:studentId", async (req, res) => {
  try {
    const studentId = String(req.params.studentId || "").trim();

    if (!studentId || !isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    const studentExists = await Student.findOne({
      _id: studentId,
      instructorId: req.user._id,
    });

    if (!studentExists) {
      return res.status(404).json({ message: "Student not found." });
    }

    const lessons = await ScheduledLesson.find({
      studentId,
      instructorId: req.user._id,
    })
      .populate("studentId", "fullName")
      .sort({ lessonDate: 1, lessonTime: 1 });

    return res.json(lessons);
  } catch (error) {
    console.error("Get student scheduled lessons error:", error.message);

    return res.status(500).json({
      message: "Failed to load scheduled lessons.",
    });
  }
});

// =========================================================
// MARK SCHEDULED LESSON AS COMPLETED
// PATCH /api/scheduled-lessons/:id/complete
// =========================================================
router.patch("/:id/complete", requireActiveSubscription, async (req, res) => {
  try {
    const lessonId = String(req.params.id || "").trim();

    if (!lessonId || !isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid scheduled lesson ID." });
    }

    const updatedLesson = await ScheduledLesson.findOneAndUpdate(
      {
        _id: lessonId,
        instructorId: req.user._id,
      },
      {
        status: "completed",
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("studentId", "fullName");

    if (!updatedLesson) {
      return res.status(404).json({ message: "Scheduled lesson not found." });
    }

    return res.json(updatedLesson);
  } catch (error) {
    console.error("Complete scheduled lesson error:", error.message);

    return res.status(500).json({
      message: "Failed to mark scheduled lesson as completed.",
    });
  }
});

// =========================================================
// CANCEL SCHEDULED LESSON
// PATCH /api/scheduled-lessons/:id/cancel
// =========================================================
router.patch("/:id/cancel", requireActiveSubscription, async (req, res) => {
  try {
    const lessonId = String(req.params.id || "").trim();

    if (!lessonId || !isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid scheduled lesson ID." });
    }

    const updatedLesson = await ScheduledLesson.findOneAndUpdate(
      {
        _id: lessonId,
        instructorId: req.user._id,
      },
      {
        status: "cancelled",
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("studentId", "fullName");

    if (!updatedLesson) {
      return res.status(404).json({ message: "Scheduled lesson not found." });
    }

    return res.json(updatedLesson);
  } catch (error) {
    console.error("Cancel scheduled lesson error:", error.message);

    return res.status(500).json({
      message: "Failed to cancel scheduled lesson.",
    });
  }
});

// =========================================================
// DELETE SCHEDULED LESSON
// DELETE /api/scheduled-lessons/:id
// =========================================================
router.delete("/:id", requireActiveSubscription, async (req, res) => {
  try {
    const lessonId = String(req.params.id || "").trim();

    if (!lessonId || !isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid scheduled lesson ID." });
    }

    const deletedLesson = await ScheduledLesson.findOneAndDelete({
      _id: lessonId,
      instructorId: req.user._id,
    });

    if (!deletedLesson) {
      return res.status(404).json({ message: "Scheduled lesson not found." });
    }

    return res.json({
      message: "Scheduled lesson deleted successfully.",
    });
  } catch (error) {
    console.error("Delete scheduled lesson error:", error.message);

    return res.status(500).json({
      message: "Failed to delete scheduled lesson.",
    });
  }
});

module.exports = router;