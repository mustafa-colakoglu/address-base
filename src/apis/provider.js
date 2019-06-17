const express = require("express");
const bodyParser = require('body-parser')
const app = express();
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
  extended: true
}));
const mongoStart = require("../models/index").init;
const PROVIDER_PORT = require("../utils/secrets").PROVIDER_PORT;
const Provider = require("../models/provider");
const providerMiddleware = require("./middleware/providerMiddleware")();
mongoStart();
app.listen(PROVIDER_PORT);
app.get("/api", async function(req, res){
    res.json("Address base provider api");
});
app.post("/api/provider/signUp", async function(req, res){
    const email = req.body.email;
    const password = req.body.password;
    const link = req.body.link;
    const createProvider = await Provider.createProvider({
        email, password, link
    });
    res.json(createProvider);
});
app.post("/api/provider/login", async function(req, res){
    const email = req.body.email;
    const password = req.body.password;
    const loginProvider = await Provider.loginProvider(email, password);
    res.json(loginProvider);
});
app.post("/api/provider/activate", async function(req, res){
    const email = req.body.email;
    const activationCode = req.body.activationCode;
    const activateProvider = await Provider.activateProvider(email, activationCode);
    res.json(activateProvider);
});
app.post("/api/provider/getAccessFromUserStep1", providerMiddleware, async function(req, res){
    const email = req.body.email;
    const providerId = req.decoded.providerId;
    const getAccessFromUserStep1 = await Provider.getAccessFromUserStep1(providerId, email);
    res.json(getAccessFromUserStep1);
});
