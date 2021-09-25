require('dotenv').config();
require("module-alias/register");
const sve = require("./sve");

const client = new sve({
    disableMentions: "everyone"
});
client.load().then(() => client.connect());
