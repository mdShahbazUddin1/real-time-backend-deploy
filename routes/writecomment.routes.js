const express = require("express")
const commentRoute = express.Router()
const commentController = require("../controller/comment.controller");
const { auth } = require("../middleware/auth");


commentRoute.post("/create/:id",auth,commentController.writeComment);
commentRoute.get("/getallcomment/:id",auth,commentController.getAllComments);
commentRoute.post(
  "/reply/:blogId/comment/:parentCommentId",
  auth,
  commentController.createReply
);
commentRoute.get("/getallreplies/:commentId",auth,commentController.getAllReplies)


module.exports = {
    commentRoute
}