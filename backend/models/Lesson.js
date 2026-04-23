const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
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
    durationMinutes: {
      type: Number,
      default: 60,
    },
    topicsCovered: [{ type: String }],
    lessonRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    notes: {
      type: String,
      default: "",
    },
    nextLessonFocus: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lesson", lessonSchema);