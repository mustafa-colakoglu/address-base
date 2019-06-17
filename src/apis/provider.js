const express = require("express");
const app = express();
const mongoStart = require("../models/index").init;
const PROVIDER_PORT = require("../utils/secrets").PROVIDER_PORT;
mongoStart();
app.listen(PROVIDER_PORT);
app.get("/api", async function(req, res){
    res.json("Address base provider api");
});