const { Router } = require("express");
const { checkAuth } = require("@server");
module.exports = client => {
  const router = Router();
  let model = require("@models/user.js");
  router.get("/", checkAuth, async (req, res) => {
    let data = await model.findOne({ user: req.user.id });

    res.render("settings.ejs", {
      bot: req.bot,
      user: req.user || null,
      data: data,
      alert: client.alert
    });
  });
  router.post("/", checkAuth, async (req, res) => {
    let data2 = await model.findOne({ user: req.user.id });
    let setdata = {
      "user": req.user.id,
      "firstName": req.body.firstname,
      "lastName": req.body.lastname,
      "aboutMe": req.body.about,
      "email": req.body.email,
      "editortheme": req.body.theme
    }
    // if (data2) {
    //   data2.firstName = req.body.firstname;
    //   data2.lastName = req.body.lastname;
    //   data2.aboutMe = req.body.about;
    //   data2.email = req.body.email
    //     data2.editortheme = req.body.theme
    // await data2.save()
    // } else{
    //   await model.create({
    //     user: req.user.id,
    //     firstName: req.body.firstname,
    //     lastName: req.body.lastname,
    //     aboutMe: req.body.about,
    //     email: req.body.email,
    //     editortheme:  req.body.theme
    //   });
    // }
    if(!data2){
      await new model(setdata).save();
    }else{
      await model.updateOne({"user": req.user.id}, {$set: setdata });
    }
    return res.json({ status: "OK" });
  });
  return router;
};
