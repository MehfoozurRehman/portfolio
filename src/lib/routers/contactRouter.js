const router = require("express").Router();
const contactModel = require("../models/contactModel");

router.get("/get_contact", async (req, res) => {
  try {
    res.send(await contactModel.find({}));
  } catch (error) {
    console.log(error);
  }
});

router.post("/set_contact", async (req, res) => {
  try {
    new contactModel(req.body).save();
    res.send(req.body);
  } catch (error) {
    console.log(error);
  }
});
router.delete("/delete_contact", async (req, res) => {
  try {
    contactModel.deleteOne({ _id: req.body._id }, (err) => {
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
