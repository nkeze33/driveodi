const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    startDate: {
      type: Date,
    },
    testDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: "",
    },
    overallProgress: {
      type: String,
      enum: ["not_started", "needs_work", "improving", "competent", "test_ready"],
      default: "not_started",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);