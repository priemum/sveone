const { Router } = require("express");
const { checkAuth } = require("@server");
module.exports = client => {
  const router = Router();
  router.get("/", checkAuth, async (req, res) => {
    res.render("dashboard.ejs", { bot: req.bot, user: req.user, alert: client.alert });
  });
  return router;
};
