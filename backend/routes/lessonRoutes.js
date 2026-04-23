// Import Express and create a router
const express = require("express");
const router = express.Router();

// Import models used in this file
const Lesson = require("../models/Lesson");
const Student = require("../models/Student");

// Import auth middleware
// This checks the JWT token and gives us req.user
const authMiddleware = require("../middleware/authMiddleware");

// Protect ALL lesson routes below this line
router.use(authMiddleware);

/* =========================================================
   CREATE A NEW LESSON FOR A STUDENT
   POST /api/lessons

   This creates a lesson only if:
   - the student exists
   - the student belongs to the logged-in instructor
   ========================================================= */
router.post("/", async (req, res) => {
  try {
    // Get lesson data from the request body
    const {
      studentId,
      lessonDate,
      durationMinutes,
      topicsCovered,
      lessonRating,
      notes,
      nextLessonFocus,
    } = req.body;

    // Check that the student exists AND belongs to this instructor
    const studentExists = await Student.findOne({
      _id: studentId,
      instructorId: req.user._id,
    });

    if (!studentExists) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Create the lesson and attach it to the logged-in instructor
    const lesson = new Lesson({
      studentId,
      instructorId: req.user._id,
      lessonDate,
      durationMinutes,
      topicsCovered,
      lessonRating,
      notes,
      nextLessonFocus,
    });

    // Save lesson to MongoDB
    const savedLesson = await lesson.save();

    // Return the saved lesson
    res.status(201).json(savedLesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    // Find lessons for this student and this instructor only
    const lessons = await Lesson.find({
      studentId: req.params.studentId,
      instructorId: req.user._id,
    }).sort({ lessonDate: -1 });

    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export the router so server.js can use it
module.exports = router;