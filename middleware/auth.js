const jwt = require("jsonwebtoken");
const{UserModel} = require("../models/Users");
const { BlackListModel } = require("../models/blacklist");
require("dotenv").config();


const auth =  async(req,res,next)=>{
    try {
        const token = req.headers?.authorization;

        if(!token) return res.status(404).json({ msg: "token is not provided" });
        const decode = jwt.verify(token, process.env.SECRET_ACCESS_KEY);
        const user = await UserModel.findOne({_id:decode.userId})
         if (!user) {
           return res.status(401).json({ message: "Invalid token" });
         }
          const blacklistToken = await BlackListModel.findOne({ token: token });

          if (blacklistToken) {
            return res.status(401).send({ msg: "login first" });
          }
         req.user = user;
         req.userId = decode.userId
         next()
    } catch (error) {
        res.status(500).send(error.message);
    }
}

module.exports = {auth}
