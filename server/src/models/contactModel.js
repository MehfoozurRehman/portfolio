const mongoose = require("mongoose");

const contactSchema = mongoose.Schema(
  {
    name: String,
    email: String,
    subject: String,
    message: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("contacts", contactSchema);
