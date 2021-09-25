const mongoose = require("mongoose");
let app = mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: false
  },
  lastName: {
    type: String,
    required: false
  },
  aboutMe: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false
  },
  editortheme: {
    type: String,
    required: false
  }
});
module.exports = mongoose.model("users", app);
