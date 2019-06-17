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
            const email = createData.email;
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
        email:{
            $eq:email
        },
        password:{
            $eq:md5(md5(password))
        },
    });
    if(findProvider){
        if(findProvider.isActivated){
            const token = jwt.sign({providerId: findProvider._id, staticCode: findProvider.staticCode}, JWT_TOKEN, { expiresIn: 60 * 60 * 24 * 365 * 10});
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
    activationCode = parseInt(activationCode);
    if(validator.isEmail(email)){
        const find = await Provider.findOne({
            email:{
                $eq:email
            },
            isActivated:{
                $eq:false
            }
        });
        if(find){
            if(find.activationCode == activationCode){
                const staticCode = randomCode();
                find.staticCode = staticCode;
                find.isActivated = true;
                find.save();
                const token = jwt.sign({providerId: find._id, staticCode: find.staticCode}, JWT_TOKEN, { expiresIn: 60 * 60 * 24 * 365 * 10});
                return {
                    error:0,
                    result:{
                        token
                    }
                };
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
                url:IP+":"+USER_PORT+"/api/user/exists",
                method:"post",
                /*headers:{
                    "Content-Type":"Basic :"+BASIC_TOKEN
                },*/
                data:{
                    email
                }
            });
            const findUser = findUserFromAxios.data;
            console.log(findUser);
            if(findUser.result){
                return {
                    error:0,
                    result:findUser.result,
                    message:"Finded"
                };
            }
            return errors.userNotFound;
        }
        catch(err){
            console.log(err);
            return errors.serviceCantUsableNow;
        }
    }
    else{
        return errors.notValidEmail;
    }
};
async function getAccessFromUserStep1(providerId, userEmail){
    const userIfExists = await existsUser(userEmail);
    if(userIfExists.errors == 0){
        const findProvider = await Provider.findById(providerId);
        if(findProvider){
            if(findProvider.isActivated){
                try{
                    const findUserAccessFromAxios = await axios({
                        url:IP+":"+ACCESS_PORT+"/api/access/findAccess",
                        method:"post",
                        headers:{
                            "Content-Type":"Basic :"+BASIC_TOKEN
                        },
                        data:{
                            email:userEmail,
                            providerId
                        }
                    });
                    const findUserAccess = findUserAccessFromAxios.data;
                    if(findUserAccess.result){
                        return {
                            error:-1,
                            message:"You have access to user."
                        };
                    }
                    else{
                        await axios({
                            url:IP+":"+ACCESS_PORT+"/api/access/createAccess",
                            method:"post",
                            headers:{
                                "Content-Type":"Basic :"+BASIC_TOKEN
                            },
                            data:{
                                email:userEmail,
                                providerId
                            }
                        });
                        return {
                            error:-2,
                            message:"You have not access to user. Sended email."
                        };
                    }
                }
                catch(err){
                    return {

                    };
                }
            }
            return errors.providerNotActivated;
        }
        return errors.providerNotFound;
    }
    else{
        return userIfExists;
    }
};
async function getAccessFromUserStep2(providerId, userEmail, accessCode){
    const getAccessWithAccessCodeAxios = await axios({
        url:IP+":"+ACCESS_PORT+"/api/access/getAccess",
        method:"post",
        headers:{
            "Content-Type":"Basic :"+BASIC_TOKEN
        },
        data:{
            email:userEmail,
            providerId,
            accessCode
        }
    });
    const getAccessWithAccessCode = getAccessWithAccessCodeAxios.data;
    if(getAccessWithAccessCode.error == 0){
        return {
            error:0,
            message:"You have access to user"
        };
    }
    else{
        return getAccessWithAccessCode;
    }
};
async function getDecodedToken(token){
    try{
        const decoded = await jwt.verify(token, JWT_TOKEN);
        return decoded;
    }
    catch(err){
        return false;
    }
};
module.exports = Provider;
module.exports = {
    ...module.exports,
    createProvider,
    loginProvider,
    activateProvider,
    existsUser,
    getAccessFromUserStep1,
    getAccessFromUserStep2,
    getDecodedToken
};