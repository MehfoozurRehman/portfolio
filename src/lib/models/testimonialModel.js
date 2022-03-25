const mongoose = require("mongoose");

const testimonialSchema = mongoose.Schema(
  {
    name: String,
    email: String,
    designation: String,
    message: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("testimonials", testimonialSchema);
