// likeBlog.controller.js

const { BlogModel } = require("../models/Blog");
const { NotificationModel } = require("../models/Notification");
// const { updateCacheOnLike, nodeCache } = require("../config/cache");

const likeBlog = async (req,res) => {
  try {
    const {blogId} = req.params
    const userId = req.userId

    const blog = await BlogModel.findById(blogId);
    const authorId = blog.author.toString();
  

    // Check if the user has already liked the blog
    const isAlreadyLiked = await NotificationModel.findOne({
      type: "like",
      notification_for: authorId,
      user: userId,
      blog: blogId,
    });

    if (isAlreadyLiked) {
      return res.status(400).send({msg:"You have already liked this blog"})
    }

    // Update the blog's like count
    await BlogModel.updateOne(
      { _id: blogId },
      { $inc: { "activity.total_likes": 1 } }
    );

     if (!blog.likedBlogs) {
       blog.likedBlogs = [userId];
     } else {
       blog.likedBlogs.push(userId);
     }

     // Save the updated blog
     await blog.save();

    // Create a new notification
    const notification = new NotificationModel({
      type: "like",
      blog: blogId,
      notification_for: authorId,
      user: userId,
    });

    await notification.save();

    // await updateCacheOnLike(BlogModel);

   res.status(200).send({msg:"blog liked succesfully"})
  } catch (error) {
    res.status(500).send({ msg: error.message});
  }
};

module.exports = { likeBlog };
