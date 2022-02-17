const express = require("express");
const cloudinary = require("cloudinary");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// api config
dotenv.config();
const app = express();
const port = process.env.PORT || 9000;

// middlewares
app.use(express.json());
app.use(cors());

// db config
mongoose.connect(process.env.MONGO_DB_URL, () => {
  console.log("db connected");
});
cloudinary.config({
  cloud_name: "mehfoozurrehman",
  api_key: "915662453295273",
  api_secret: "msK9WHKJPgdH93nmAEi88kDl0jI",
});

// api endpoints
app.get("/", (req, res) => {
  res.json({
    message: "hey",
  });
});
app.post("/upload", (req, res) => {
  cloudinary.v2.uploader.upload(
    "https://avatars.githubusercontent.com/u/69617285?v=4",
    { public_id: "bilal" },
    function (error, result) {
      console.log(result);
    }
  );
});
// listners
app.listen(port, () => console.log(`api working on ${port}`));
