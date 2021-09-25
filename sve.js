const { Client } = require("discord.js");
let mongoose = require("mongoose")
module.exports = class sve extends Client {
  constructor(...options) {
    super(...options);

    this.express = require("express")(); /* Express Server */
    this.server = require("http").Server(this.express); /* HTTP Server */

    this.alert = {
      exist: true,
      type: "dark",
      text: `<b>Attention!</b> This website is still in early beta! Somethings may not work or exist &nbsp;<a href='https://ashmw.com/contact' target='_blank' class='btn btn-sm btn-neutral text-primary'>AshMW.com</a>`
    }
  }

  load() {
    return new Promise(resolve => {
      mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, () => console.log("Connected to db"));
      require("./server")(this).then(() =>
        console.log(`Listening on PORT ${process.env.PORT} (Server)`)
      );

      return resolve();
    });
  }

  connect() {
    return this.login(process.env.TOKEN);
  }
};
