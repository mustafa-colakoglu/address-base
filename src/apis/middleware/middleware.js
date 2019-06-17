const User = require("../../models/user");
const BASIC_TOKEN = require("../../utils/secrets").BASIC_TOKEN;
module.exports = function(){
    return async function(req, res, next){
        let token = req.headers["authorization"];
        let logined = false;
        if(token){
            if(token.substring(0,7) == "Bearer "){
                token = token.slice(7, token.length);
                const decoded = await User.getDecodedToken(token);
                if(decoded){
                    req.decoded = decoded;
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
}