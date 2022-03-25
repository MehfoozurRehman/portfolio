const router = require("express").Router();
const testimonialModel = require("../models/testimonialModel");

router.get("/get_testimonial", async (req, res) => {
  try {
    res.send(await testimonialModel.find({}));
  } catch (error) {
    console.log(error);
  }
});

router.post("/set_testimonial", async (req, res) => {
  try {
    new testimonialModel(req.body).save();
    res.send(req.body);
  } catch (error) {
    console.log(error);
  }
});
router.delete("/delete_testimonial", async (req, res) => {
  try {
    testimonialModel.deleteOne({ _id: req.body._id }, (err) => {
      if (err) {
        console.log(err);
      } else {
        res.json({
          message: "successfully Deleted",
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
