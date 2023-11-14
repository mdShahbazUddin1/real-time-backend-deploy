// likeBlog.route.js

const express = require("express");
const likeRouter = express.Router();

const likeBlogController = require("../controller/like.controller"); // Import your likeBlog controller
const { auth } = require("../middleware/auth");

// Handle the "likeBlog" action
likeRouter.post("/likeblog/:blogId", auth,likeBlogController.likeBlog);

module.exports = likeRouter;
