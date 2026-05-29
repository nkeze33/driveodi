const mongoose = require("mongoose");

const scheduledLessonSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lessonDate: {
      type: Date,
      required: true,
    },

    lessonTime: {
      type: String,
      required: true,
      trim: true,
    },

    durationMinutes: {
      type: Number,
      default: 120,
      min: 30,
      max: 300,
    },

    notes: {
      type: String,
      default: "",
      maxlength: 500,
      trim: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ScheduledLesson",
  scheduledLessonSchema
);