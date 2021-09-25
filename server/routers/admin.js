const { Router } = require("express");
const { checkAuth, checkStaff } = require("@server");
module.exports = client => {
  const router = Router();
  let model = require("@models/pagemodel.js");
  router.get("/pages", checkAuth, checkStaff, async (req, res) => {
    let size = await model.find();
    size = size.length;
    let pageinfo = {
      size: size,
      pages: await model.find()
    };
    res.render("adminpages.ejs", { bot: req.bot, user: req.user || null, pageinfo, alert: client.alert });
  });

  return router;
};
