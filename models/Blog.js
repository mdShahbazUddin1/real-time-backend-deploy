const mongoose = require("mongoose");

const blogSchema = mongoose.Schema(
  {
    blog_id: {
      type: String,
      require: true,
      unique: true,
    },
    title: {
      type: String,
      // required: true,
    },
    banner: {
      type: String,
      // required: true,
    },
    des: {
      type: String,
      maxlength: 200,
      // required: true
    },
    content: {
      type: String,
      // required: true
    },
    tags: {
      type: [String],
      // required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    activity: {
      total_likes: {
        type: Number,
        default: 0,
      },
      total_comments: {
        type: Number,
        default: 0,
      },
      total_reads: {
        type: Number,
        default: 0,
      },
      total_parent_comments: {
        type: Number,
        default: 0,
      },
    },
    comments: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "comment",
    },
    draft: {
      type: Boolean,
      default: false,
    },
    likedBlogs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "blog",
      },
    ],
  },
  {
    timestamps: {
      createdAt: "publishedAt",
    },
  }
);

blogSchema.index({ blog_id: 1 }, { unique: true });
blogSchema.index({ draft: 1 });
blogSchema.index({ author: 1 });
blogSchema.index({ tags: 1 });

const BlogModel = mongoose.model("blog", blogSchema);

module.exports = {
  BlogModel,
};
