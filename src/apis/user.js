const express = require("express");
const app = express();
const mongoStart = require("../models/index").init;
const USER_PORT = require("../utils/secrets").USER_PORT;
mongoStart();
app.listen(USER_PORT);
app.get("/api", async function(req, res){
    res.json("Address base user api");
});
