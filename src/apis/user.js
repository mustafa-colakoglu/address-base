const express = require("express");
const bodyParser = require('body-parser')
const app = express();
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
  extended: true
}));
const mongoStart = require("../models/index").init;
const USER_PORT = require("../utils/secrets").USER_PORT;
const User = require("../models/user");
mongoStart();
const errors = require("../utils/errors");
app.listen(USER_PORT);
app.get("/api", async function(req, res){
    res.json("Address base user api");
});
app.post("/api/user/exists", async function(req, res){
  const email = req.body.email;
  const user = await User.exists(email);
  res.json(user);
});
