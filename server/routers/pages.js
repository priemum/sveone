const {
  Router
} = require("express");
const {
  checkAuth
} = require("@server");
const fs = require('fs'),
  path = require('path');

var cf = require('cloudflare')({
  token: process.env.CLOUDFLARE_TOKEN
});

module.exports = client => {
  const router = Router();
  let pagemodel = require("@models/pagemodel.js");
  let usermodel = require("@models/user.js");
  router.get("/", checkAuth, async (req, res) => {
    let size = await pagemodel.find({
      owner: req.user.id
    });
    size = size.length;
    let pageinfo = {
      size: size,
      pages: await pagemodel.find({
        owner: req.user.id
      })
    };
    res.render("pages.ejs", {
      bot: req.bot,
      user: req.user || null,
      pageinfo,
      alert: client.alert
    });

  });
  router.post("/new", checkAuth, async (req, res) => {
    let size = await pagemodel.find({
      owner: req.user.id
    });
    let userinfo = await usermodel.find({
      user: req.user.id
    })
    size = size.length;
    let pageinfo = {
      size: size,
      pages: await pagemodel.find({
        owner: req.user.id
      })
    };
    let title = req.body.domain;
    let size2 = await pagemodel.findOne({
      link: title
    });

    let array = ["cosmicservers", "dashboard", "levl", "expressbots"]
    if (size2 || array.includes(title.toLowerCase())) {
      let error = {
        code: 403,
        content: "This page already exists"
      };
      res.render("error.ejs", {
        error
      });
    } else if (pageinfo.size === 8 && !req.user.staff) {
      let error = {
        code: 403,
        content: "You cant have more then 8 pages"
      };
      res.render("error.ejs", {
        error
      });
    } else if (!userinfo) {
      let error = {
        code: 403,
        content: "Please update settings first"
      };
      res.render("error.ejs", {
        error
      });
    } else {
      let defaultpg = await fs.readFileSync(path.join(__dirname, '../pages/blocks') + '/defaultpage.ejs', 'utf8');
      defaultpg = defaultpg.toString()
      await pagemodel.create({
        owner: req.user.id,
        title: req.body.title,
        link: req.body.domain,
        description: req.body.desc,
        html: req.body.default ? defaultpg : "This user has not yet edited this page",
        private: req.body.private ? true : false
      });
      cf.dnsRecords.add(process.env.ZONE_ID, {
        "type": "CNAME",
        "name": req.body.domain,
        "content": "eloncars.com",
        "ttl": 1,
        "proxied": true
      })
      res.redirect("/pages");
    }
  });

  router.get("/edit/:link", checkAuth, async (req, res) => {
    let title = req.params.link;
    let size = await pagemodel.findOne({
      link: title
    });
    if (!size) {
      let error = {
        code: 404,
        content: "Page not found"
      };
      res.render("error.ejs", {
        error
      });
    } else if (req.user.id !== size.owner && !req.user.staff) {
      let error = {
        code: 403,
        content: "Youre not owner"
      };
      res.render("error.ejs", {
        error
      });
    } else {
      let rawu = await client.users.fetch(size.owner);
      let data = await usermodel.findOne({ user: req.user.id })
      let html = size.html
      res.render("edit.ejs", {
        bot: req.bot,
        user: req.user || null,
        pageinfo: size,
        pageowner: rawu,
        html,
        alert: client.alert,
        data
      })
    }
  });

  router.post("/edit/:link", checkAuth, async (req, res) => {
    let title = req.params.link;
    let size = await pagemodel.findOne({
      link: title
    });
    if (!size) {
      let error = {
        code: 404,
        content: "Page not found"
      };
      res.render("error.ejs", {
        error
      });
    } else if (req.user.id !== size.owner && !req.user.staff) {
      let error = {
        code: 403,
        content: "Youre not owner"
      };
      res.render("error.ejs", {
        error
      });
    } else {
      size.title = req.body.title
      size.private = req.body.private ? true : false
      size.description = req.body.desc
      size.html = req.body.html
      await size.save()

      res.redirect(`/pages/edit/${title}`)
    }
  });
  router.post("/delete/:link", checkAuth, async (req, res) => {
    let title = req.params.link;
    let size = await pagemodel.findOne({
      link: title
    });
    if (!size) {
      let error = {
        code: 404,
        content: "Page not found"
      };
      res.render("error.ejs", {
        error
      });
    } else if (req.user.id !== size.owner && !req.user.staff) {
      let error = {
        code: 403,
        content: "Youre not owner"
      };
      res.render("error.ejs", {
        error
      });
    } else {
      await pagemodel.findOneAndDelete({
        link: title
      });
      const dns_records = await cf.dnsRecords.browse(process.env.ZONE_ID);
      cf.dnsRecords.del(process.env.ZONE_ID, dns_records.result.filter(dr => dr.name === `${title}.sve.one`)[0].id)
      res.redirect("/pages");
    }
  });
  router.get("/info/:page", async (req, res) => {
    let title = req.params.page;
    let size = await pagemodel.findOne({
      link: title
    });

    if (!size) {
      let error = {
        code: 404,
        content: "Page not found"
      };
      res.render("error.ejs", {
        error
      });
    } else if (size.private && size.private === true && req.user && req.user.id !== size.owner) {
      let error = {
        code: 403,
        content: "This is a private page"
      };
      res.render("error.ejs", {
        error
      });
    } else if (size.private && size.private === true && !req.user) {
      let error = {
        code: 403,
        content: "This is a private page"
      };
      res.render("error.ejs", {
        error
      });
    } else {
      let rawu = await client.users.fetch(size.owner);
      let userinfo = await usermodel.findOne({
        user: rawu.id
      })
      res.render("info.ejs", {
        bot: req.bot,
        user: req.user || null,
        pageinfo: size,
        alert: client.alert,
        pageowner: rawu,
        userinfo,
        isSubdomain: false
      })
    }
  })
  router.get("/search", async (req, res) => {
    let pages = await pagemodel.find({ private: false })
    res.render("search.ejs", { pages, user: req.user || null, bot: req.bot })
  })
  router.get("/view/:page", async (req, res) => {
    let title = req.params.page;
    let size = await pagemodel.findOne({
      link: title
    });
    if (!size) {
      let error = {
        code: 404,
        content: "Page not found"
      };
      res.render("error.ejs", {
        error
      });
    } else {
      size.views = size.views + 1
      await size.save()
      res.render("userpage.ejs", {
        pagestuff: size
      })
    }
  });

  return router;
};
