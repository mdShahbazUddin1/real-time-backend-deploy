const { NotificationModel } = require("../models/Notification");

const getAuthorNotifications = async (req, res) => {
  try {
    const userId = req.userId; 
    
    const notifications = await NotificationModel.find({
      notification_for: userId
    })
      .populate("blog")
      .populate("user");

      if(!notifications) return res.status(403).send({msg:"no notification found"})

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const markNotificationsAsSeen = async (req, res) => {
  const userId = req.userId; // Assuming you have user authentication middleware

  try {
    // Find all notifications for the user where seen is false
    const notifications = await NotificationModel.find({
      notification_for: userId,
      seen: false,
    });

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({ error: "No new notifications found" });
    }

    // Mark these notifications as seen
    for (const notification of notifications) {
      notification.seen = true;
      await notification.save();
    }

    res.json({ message: "Notifications marked as seen" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getAuthorNotifications,
  markNotificationsAsSeen
};
