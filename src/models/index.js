const mongoose = require("mongoose");
const MONGODB_URI = require("../utils/secrets").MONGODB_URI;
module.exports.init = async function(){
    mongoose.connect(
        MONGODB_URI,
        { useNewUrlParser: true }
    );
    mongoose.set('useFindAndModify', false);
}