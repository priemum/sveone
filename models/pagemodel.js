const mongoose = require("mongoose");

let app = mongoose.Schema({
  owner: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  link: {
    type: String,
    required: true
  },
  html: {
    type: String,
    default: "This user has not yet edited this page"
  },
  private: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  uviews: {
    type: Array,
    default: []
  }
});
module.exports = mongoose.model("pages", app);
