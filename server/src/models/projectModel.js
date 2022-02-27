const mongoose = require("mongoose");

const projectSchema = mongoose.Schema(
  {
    name: String,
    languages: Array,
    image: String,
    description: String,
    category: String,
    date: String,
    client: String,
    url: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("projects", projectSchema);
