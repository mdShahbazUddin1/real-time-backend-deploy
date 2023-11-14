const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["like", "comment", "reply"],
      required: true,
    },
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "blog",
    },
    notification_for: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment",
    },
    reply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment",
    },
    replied_on_comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment",
    },
    seen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const NotificationModel = mongoose.model("notification", notificationSchema);

module.exports = {
    NotificationModel
}
