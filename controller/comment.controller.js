const { CommentModel } = require("../models/Comment");
const { BlogModel } = require("../models/Blog");
const { NotificationModel } = require("../models/Notification");

const writeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, isReply, parent } = req.body;

    const blog = await BlogModel.findById(id);
    if (!blog) {
      return res.status(404).json({ success: false, error: "Blog not found" });
    }
    const commented_by = req.userId;
    const newComment = new CommentModel({
      blog_id: blog._id,
      blog_author: blog.author,
      comment,
      commented_by,
      isReply,
      parent,
    });
    // Save the comment to the database
    const savedComment = await newComment.save();

    await BlogModel.findByIdAndUpdate(id, {
      $inc: { "activity.total_comments": 1 },
    });

      const newNotification = new NotificationModel({
        type: "comment",
        blog: blog._id,
        notification_for: blog.author,
        user: commented_by,
        comment: savedComment._id,
        seen: false,
      });
      await newNotification.save();

      res.status(201).json({ success: true, comment: savedComment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllComments = async (req, res) => {
  try {
    const { blogId } = req.params;
const authorId = req.userId
    // Find all comments for the specified blog
    const comments = await CommentModel.find({
      blogId,
      isReply: false,
      parent: null,
    })
      .populate("commented_by")
      .exec();

    res.status(200).json({ success: true, comments , authorId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const createReply = async(req,res) => {
  try {
    const { comment } = req.body;
    const { blogId, parentCommentId } = req.params;
    const userId = req.userId;

    const blog = await BlogModel.findById(blogId);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const parentComment = await CommentModel.findById(parentCommentId);
    if (!parentComment) {
      return res.status(404).json({ message: "Parent comment not found" });
    }

    // Create a new reply
    const newReply = new CommentModel({
      blog_id: blogId,
      blog_author: blog.author,
      comment,
      commented_by: userId,
      isReply: true,
      parent: parentCommentId,
    });

    // Save the new reply
    const savedReply = await newReply.save();

    // Update the parent comment to include the new reply
    parentComment.children.push(savedReply._id);
    await parentComment.save();

    // Update the blog to include the new reply
    blog.comments.push(savedReply._id);
    await blog.save();

    res.status(200).json(savedReply);
  } catch (error) {
    res.status(500).json({ message: error.message});
  }
}

const getAllReplies = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Find the comment by ID and populate the 'children' field to get its replies
    const comment = await CommentModel.findById(commentId)
      .populate({
        path: "children",
        populate: {
          path: "commented_by",
          model: "user", // Replace with your user model
        },
      })
      .populate("commented_by")
      .exec();

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Extract replies from the 'children' field
    const replies = comment.children;
    if (!replies || replies.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "No replies found" });
    }

    res.status(200).json({ success: true, replies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};




module.exports = {
    writeComment,
    getAllComments,
    createReply,
    getAllReplies
}
