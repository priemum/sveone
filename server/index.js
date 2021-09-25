const path = require("path"),
  session = require("express-session"),
  SQLiteStore = require("connect-sqlite3")(session),
  express = require("express"),
  passport = require("passport"),
  { Strategy } = require("passport-discord").Strategy,
  mongoose = require("mongoose"),
  usermodel = require("@models/user.js"),
  fetch = require('node-fetch')
module.exports = client => new Promise(resolve => {
  const server = client.server, app = client.express;
  app.use(require("express").json());
  app.use(require("express").urlencoded({ extended: false }));
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "pages"));
  app.use("/assets", express.static(path.join(__dirname, "/public/assets")));
  bindAuth(app, client);
  app.use("/dashboard", require("@routers/dashboard.js")(client));
  app.use("/settings", require("@routers/settings.js")(client));
  app.use("/pages", require("@routers/pages.js")(client));
  app.use("/admin", require("@routers/admin.js")(client));
  app.use("/user", require("@routers/profile.js")(client));

  let model = require("@models/pagemodel.js");

  app.get("/tos", async (req, res) => {
    res.render("tos.ejs", {
      bot: req.bot,
      user: req.user || null,
      alert: client.alert
    });
  })
  app.get("/terms", async (req, res) => {
    res.render("terms.ejs", {
      bot: req.bot,
      user: req.user || null,
      alert: client.alert
    });
  })
  app.get("/privacy", async (req, res) => {
    res.render("privacy.ejs", { bot: req.bot, user: req.user || null, alert: client.alert });
  })
  app.get("/", async (req, res) => {
    if (req.user) {
      let usermodel = require("@models/user.js")
      let data = await usermodel.findOne({ user: req.user.id })
      if (data) {

      } else {
        await usermodel.create({
          user: req.user.id,
          email: req.user.email,
          editortheme: "ambiance",
          firstName: "",
          lastName: "",
          aboutMe: ""
        })
      }
    }
    if (req.headers.host.split('.').length == 3) {
      let title = req.headers.host.split('.')[0];
      if(title == "www") return res.redirect(process.env.DOMAIN);
      let size = await model.findOne({
        link: title
      });
      if (!size) {
        let error = {
          code: 404,
          content: "Page not found"
        };
        return res.render("error.ejs", {
          error
        });
      } else {
        size.views = size.views + 1
        await size.save()
        return res.render("userpage.ejs", {
          pagestuff: size
        })
      }
    }
    return res.render("index.ejs", {
      bot: req.bot,
      user: req.user || null,
      alert: client.alert
    });
  });

  app.get("/info", async (req, res) => {
    if (req.headers.host.split('.').length == 3) {
      let title = req.headers.host.split('.')[0];
      let size = await model.findOne({
        link: title
      });

      if (!size) {
        let error = {
          code: 404,
          content: "Page not found"
        };
        return res.render("error.ejs", {
          error
        });
      } else if (size.private && size.private === true && req.user && req.user.id !== size.owner) {
        let error = {
          code: 403,
          content: "This is a private page"
        };
        return res.render("error.ejs", {
          error
        });
      } else if (size.private && size.private === true && !req.user) {
        let error = {
          code: 403,
          content: "This is a private page"
        };
        return res.render("error.ejs", {
          error
        });
      } else {
        let rawu = await client.users.fetch(size.owner);
        let userinfo = await usermodel.findOne({
          user: rawu.id
        })
        return res.render("info.ejs", {
          bot: req.bot,
          user: req.user || null,
          pageinfo: size,
          alert: client.alert,
          pageowner: rawu,
          userinfo,
          isSubdomain: true
        })
      }
    }
    let error = {
      code: 404,
      content: "Page not found"
    }
    return res.render("error.ejs", {
      error
    })
  });
  app.get("*", async (req, res) => {
    let error = {
      code: 404,
      content: "Page not found"
    }
    res.render("error.ejs", {
      error
    })
  })
  server.listen(process.env.PORT);
  resolve();
});
module.exports.checkAuth = function checkAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}
module.exports.checkStaff = async function checkStaff(req, res, next) {
  if (!req.isAuthenticated()) return res.redirect("/login");
  if (req.user.staff) return next();
  res.redirect("/");
}

function bindAuth(app, client) {
  app.use(
    session({
      store: new SQLiteStore(),
      secret: "Pagepal",
      resave: false,
      saveUninitialized: false
    })
  );
  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (obj, done) {
    done(null, obj);
  });
  passport.use(
    new Strategy({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: `${process.env.DOMAIN}/auth/callback`,
      scope: process.env.SCOPES.split(' ').join(" ")
    },
      function (accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
          profile.tokens = {
            accessToken
          };
          return done(null, profile);
        });
      }
    )
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.get("/login", (req, res) => {
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.DOMAIN}/auth/callback`)}&response_type=code&scope=${encodeURIComponent(process.env.SCOPES.split(" ").join(" "))}`);
  });
  app.get("/auth/callback", passport.authenticate("discord", { failureRedirect: "/" }), (req, res) => res.redirect("/"));
  app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
  });
  app.use((req, res, next) => {
    req.bot = client;
    !req.user ? ' ' : process.env.ADMINS.split(' ').includes(req.user.id) ? req.user.staff = true : req.user.staff = false
    next();
  });
}
