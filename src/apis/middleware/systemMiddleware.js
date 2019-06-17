const BASIC_TOKEN = require("../../utils/secrets").BASIC_TOKEN;
module.exports = function(){
    return async function(req, res, next){
        let token = req.headers["authorization"];
        let logined = false;
        if(token){
            if(token.substring(0,6) == "Basic "){
                token = token.slice(7, token.length);
                if(token == BASIC_TOKEN){
                    req.decoded = {userId:1};
                    logined = true;
                }
            }
        }
        if(logined){
            next();
        }
        else{
            res.status(401);
            res.json({
                error:1,
                message:"You Have to login"
            });
        }
    }
};