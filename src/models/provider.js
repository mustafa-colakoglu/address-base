const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require('jsonwebtoken');
const axios = require("axios");
const errors = require("../utils/errors");
const sendActivationCode = require("../utils/sendActivationCode");
const randomCode = require("../utils/randomCode");
const md5 = require("md5");
const {IP, USER_PORT, ACCESS_PORT, JWT_TOKEN, BASIC_TOKEN} = require("../utils/secrets")
const ProviderSchema = mongoose.Schema({
    link           : String ,
    title          : String ,
    email          : String ,
    password       : String ,
    activationCode : String ,
    isActivated    : Boolean,
    isRemoved      : Boolean,
    apiKey         : String,
    apiSecret      : String
},{ timestamps: true, minimize: false });
const Provider = mongoose.model("Provider", ProviderSchema, "providers");
const createProvider = async function(createData = {}){
    if(validator.isEmail(createData.email)){
        const control = await Provider.findOne({
            $or:[
                {
                    email:{
                        $eq:createData.email
                    }
                },
                {
                    link:{
                        $eq:createData.link
                    }
                }
            ]
        });
        if(control){
            return errors.emailOrSiteOnlyExists;
        }
        else{
            const emailParse = email.split("@");
            const emailLink  = emailParse[1];
            if(emailLink == createData.link){
                const activationCode = parseInt(Math.random() * 100000);
                const create = await Provider.create({
                    ...createData,
                    password:md5(md5(createData.password)),
                    isRemoved:false,
                    isActivated:false,
                    activationCode
                });
                return {
                    error:0,
                    result:{
                        email:create.email,
                        link:create.link
                    },
                    message:"Created"
                };           
            }
            else{
                return errors.emailIsNotTrue;
            }
        }
    }
    else{
        return errors.notValidEmail;
    }
};
const loginProvider = async function(email, password){
    const findProvider = await Provider.findOne({
        email,
        password:md5(md5(password)),
    });
    if(findProvider){
        if(findProvider.isActivated){
            const token = jwt.sign({userId: find._id, staticCode: find.staticCode}, JWT_TOKEN, { expiresIn: 60 * 60 * 24 * 365 * 10});
            return {
                error:0,
                result:{
                    token
                }
            };
        }
        return errors.providerNotActivated;
    }
    else{
        return errors.providerNotFound
    }
};
async function activateProvider(email, activationCode){
    if(validator.isEmail(email)){
        const find = await User.findOne({email, isActivated:false});
        if(find){
            if(find.activationCode == activationCode){
                const staticCode = randomCode();
                find.staticCode = staticCode;
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
async function existsUser(email){
    if(validator.isEmail(email)){
        try{
            const findUserFromAxios = await axios({
                url:IP+":"+USER_PORT+"/exists",
                method:"post",
                headers:{
                    "Content-Type":"Basic :"+BASIC_TOKEN
                },
                data:{
                    email
                }
            });
            const findUser = findUserFromAxios.data;
            if(findUser.result){
                return true;
            }
            return false;
        }
        catch(err){
            return false;
        }
    }
    else{
        return errors.notValidEmail;
    }
};
async function getAccessFromUserStep1(providerId, userEmail){
    const findProvider = await Provider.findById(providerId);
    if(findProvider){
        if(findProvider.isActivated){
            const findUserAccessFromAxios = await axios({
                url:IP+":"+ACCESS_PORT+"/findAccess",
                method:"post",
                headers:{
                    "Content-Type":"Basic :"+BASIC_TOKEN
                },
                data:{
                    email:userEmail,
                    providerId
                }
            });
            //TODO: User varsa izin iste, yoksa user kaydı yap ve aktivasyon yaparken izini de ver
            const findUserAccess = findUserAccessFromAxios.data;
            if(findUserAccess.result){
                return {
                    error:-1,
                    message:"You have access to user."
                };
            }
            else{
                return {
                    error:-2,
                    message:"You have not access to user. Sended email."
                };
            }
        }
        return errors.providerNotActivated;
    }
    return errors.providerNotFound; 
};
async function getAccessFromUserStep2(providerId, userEmail, activationCode){}
module.exports = Provider;
module.exports = {
    ...module.exports,
    createProvider,
    loginProvider,
    activateProvider,
    existsUser,
    getAccessFromUserStep1
};