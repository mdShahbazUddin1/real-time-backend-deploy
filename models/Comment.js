const mongoose = require("mongoose");

const commentSchema = mongoose.Schema(
  {
    blog_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "blog",
    },
    blog_author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    comment: {
      type: String,
      required: true,
    },
    children: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "comment",
    },
    commented_by: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "user",
    },
    isReply: {
      type: Boolean,
      default: false,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment",
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "commentedAt",
    },
  }
);

const CommentModel = mongoose.model("comment", commentSchema);

module.exports = {
    CommentModel
}
