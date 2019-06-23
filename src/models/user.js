const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require('jsonwebtoken');
const errors = require("../utils/errors");
const sendActivationCode = require("../utils/sendActivationCode");
const randomCode = require("../utils/randomCode");
const JWT_TOKEN = require("../utils/secrets").JWT_TOKEN;
const UserSchema = mongoose.Schema({
    email          : String,
    activationCode : String,
    isActivated    : Boolean,
    isRemoved      : Boolean,
    staticCode     : String,
    code           : String,
    codeStartTime  : mongoose.Schema.Types.Date,
    withProvider   : Boolean,
    providerId     : Number
},{ timestamps: true, minimize: false });
const User = mongoose.model("User", UserSchema, "users");
async function createUser(email, providerId){
    if(validator.isEmail(email)){
        if(!exists(email)){
            const activationCode = parseInt(Math.random() * 100000);
            const withProvider = providerId ? {
                providerId,
                withProvider:true
            } : {};
            const createData = {
                email,
                isActivated:false,
                isRemoved:false,
                activationCode,
                ...withProvider
            };
            const create = await User.create(createData);
            sendActivationCode(email, code);
            return {
                error:0,
                result:{
                    email:create.email
                },
                message:"Created"
            };
        }
        else{
            return errors.emailOnlyExists
        }
    }
    else{
        return errors.notValidEmail;
    }
};
async function activateUser(email, activationCode){
    if(validator.isEmail(email)){
        const find = await User.findOne({email, isActivated:false});
        if(find){
            if(find.activationCode == activationCode){
                const staticCode = randomCode();
                find.staticCode = staticCode;
                if(find.withProvider){
                    const giveAccessToUser = await axios({
                        url:IP+":"+ACCESS_PORT+"/giveForceAccess",
                        method:"post",
                        headers:{
                            "Content-Type":"Basic :"+BASIC_TOKEN
                        },
                        data:{
                            email:find.email,
                            providerId
                        }
                    });
                    find.withProvider = undefined;
                    find.providerId   = undefined;
                }
                find.save();
                const token = await loginUserStep2(email, undefined, true);
                return token;
            }
            else{
                return errors.activationCodeError
            }
        }
        else{
            return errors.userNotFound
        }
    }
    else{
        return errors.notValidEmail;
    }
};
/*async function loginUserStep1(email){
    if(validator.isEmail(email)){
        if(exists(email)){
            sendLoginCode(email);
            return {
                error:0,
                result:"Login code sended to email"
            };
        }
        else{
            return errors.userNotFound;
        }
    }
    else{
        return errors.notValidEmail;
    }
};
async function loginUserStep2(email, code = undefined, first = false){
    if(validator.isEmail(email)){
        const find = await User.findOne({email});
        if(find){
            if(first){
                const token = jwt.sign({userId: find._id, staticCode: find.staticCode}, JWT_TOKEN, { expiresIn: 60 * 60 * 24 * 365 * 10});
                return {
                    error:0,
                    result:{
                        token,
                        email,
                        isActivated:true
                    }
                };
            }
            else if(code == find.code){
                const token = jwt.sign({userId: find._id, staticCode: find.staticCode}, JWT_TOKEN, { expiresIn: 60 * 60 * 24 * 365 * 10});
                return {
                    error:0,
                    result:{
                        token,
                        email,
                        isActivated:true
                    }
                };
            }
            else{
                return errors.loginError;
            }
        }
        else{
            return errors.userNotFound;
        }
    }
    else{
        return errors.notValidEmail;
    }
};*/
async function getDecodedToken(token){
    try{
        const decoded = await jwt.verify(token, JWT_TOKEN);
        return decoded;
    }
    catch(err){
        return false;
    }
};
async function exists(email){
    const find = await User.findOne({email});
    if(find){
        return true;
    }
    return false;
};
module.exports = User;
module.exports = {
    ...module.exports,
    createUser,
    activateUser,
    getDecodedToken,
    exists
};