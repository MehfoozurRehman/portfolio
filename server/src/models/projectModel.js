const mongoose = require("mongoose");

const projectSchema = mongoose.Schema(
  {
    name: String,
    languages: String,
    image: String,
    description: String,
    category: Array,
    date: String,
    client: String,
    url: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("projects", projectSchema);
