const express = require("express")
const { auth } = require("../middleware/auth")
const notifyRouter = express.Router()
const notiController = require("../controller/notify.controller")



notifyRouter.get("/getnotification",auth,notiController.getAuthorNotifications)
notifyRouter.get("/markasseen", auth, notiController.markNotificationsAsSeen);


module.exports = {
    notifyRouter
}