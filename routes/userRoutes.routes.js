const express = require("express")
const userRouter = express.Router();

const userController = require("../controller/user.controller");
const { auth } = require("../middleware/auth");


userRouter.post("/register",userController.register);
userRouter.post("/login",userController.login);
userRouter.post("/googleAuth",userController.googleAuth);
userRouter.get("/logout",auth, userController.logout);
userRouter.post("/changepassword",auth, userController.changePassword);


module.exports = {userRouter}