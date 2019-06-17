const dotenv = require("dotenv");
dotenv.config({ path: ".env" });
module.exports.MONGODB_URI=process.env.MONGODB_URI;
module.exports.JWT_TOKEN=process.env.JWT_TOKEN;
module.exports.BASIC_TOKEN=process.env.BASIC_TOKEN;
module.exports.IP=process.env.IP;
module.exports.USER_PORT=process.env.USER_PORT;
module.exports.PROVIDER_PORT=process.env.PROVIDER_PORT;