const express = require("express");
const cloudinary = require("cloudinary");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");
const contactRouter = require("./routers/contactRouter");
const projectRouter = require("./routers/projectRouter");

// api config
dotenv.config();
const app = express();
const port = process.env.PORT || 9000;

// middlewares
app.use(express.json());
app.use(cors());
app.use(fileUpload());

// db config
mongoose
  .connect(process.env.MONGO_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to database");
  })
  .catch((error) => {
    console.log("database connection failed. exiting now...");
    console.error(error);
  });
cloudinary.config({
  cloud_name: "mehfoozurrehman",
  api_key: "915662453295273",
  api_secret: "msK9WHKJPgdH93nmAEi88kDl0jI",
});

// api endpoints
app.get("/", (req, res) => {
  res.json({
    message: "hey welcome to mehfooz-ur-rehman's portfolio",
  });
});
app.post("/upload", function (req, res) {
  // const image = req.files.image;
  // console.log(image);
  cloudinary.v2.uploader.upload(
    "https://avatars.githubusercontent.com/u/68416499?s=400&u=e4115c8a9a984f4b5075cd9c1de86ecf1fe23da5&v=4",
    { public_id: "mehfooz" },
    function (error, result) {
      console.log(result);
    }
  );
});
app.use("/api/v1", contactRouter);
app.use("/api/v1", projectRouter);
// listners
app.listen(port, () => console.log(`api working on ${port}`));
