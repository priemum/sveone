const { Router } = require("express");
const { checkAuth } = require("@server");
module.exports = client => {
  const router = Router();
  let usermodel = require("@models/user.js");
    let pagemodel = require("@models/pagemodel.js");
  router.get("/:id", async (req, res) => {
      let user = req.params.id
      let data = await usermodel.findOne({user: user})
      if(!data){
            let error = {
        code: 404,
        content: "User not found"
      };
      res.render("error.ejs", {
        error
      });
      }else{
          let userpages = await pagemodel.find({owner: user, private: false})
          data.userpages = userpages
          
          let theuser =  await client.users.fetch(user);
          theuser.staff = process.env.ADMINS.split(' ').includes(theuser.id) ? true : false
          res.render("profile.ejs", {user: req.user || null, bot: req.bot, theuser, data, alert: client.alert})
      }
  });
  return router;
};
