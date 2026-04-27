const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    // The student this lesson belongs to
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // The instructor/user who owns this lesson
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Date of the lesson
    lessonDate: {
      type: Date,
      required: true,
    },

    // Lesson duration in minutes
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 300,
      default: 60,
    },

    // Topics covered during the lesson
    topicsCovered: {
      type: [String],
      default: [],
      validate: {
        validator: function (topics) {
          return topics.length <= 20 && topics.every((t) => t.length <= 80);
        },
        message: "Topics covered must be 20 items max, 80 characters each.",
      },
    },

    // Optional lesson rating
    lessonRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    // General notes
    notes: {
      type: String,
      default: "",
      maxlength: 1000,
      trim: true,
    },

    // What to focus on next lesson
    nextLessonFocus: {
      type: String,
      default: "",
      maxlength: 200,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lesson", lessonSchema);