const Notification = require('../models/notificationModel');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/apiError');
const UserFcmToken = require('../models/userFcmTokenModel');
const { sendPushNotification, sendPushNotificationToMany } = require('../utils/sendPushNotification');

// ****************** services ******************

// @desc    Create and send notification to a user
// @access  Private
exports.createNotification = async (userId, title, body, type) => {
    // 1) Create notification in database
    const notification = await Notification.create({
        user: userId,
        title,
        body,
        type : type || 'other'
    });
    // 2) Check if user has FCM token
    const userFcmToken = await UserFcmToken.findOne({ user: userId });
    // 3) If user has FCM token, send push notification
    if (userFcmToken) {
        await sendPushNotification(
            userFcmToken.fcmToken,
            title,
            body
        );
    }

    return notification;
};

// @desc    Create and send notification to multiple users
// @access  Private
exports.createNotificationForMany = async (userIds, title, body, type) => {
    // 1) Create notifications in database for all users
    const notifications = await Notification.insertMany(
        userIds.map(userId => ({
            user: userId,
            title,
            body,
            type: type || 'other'
        }))
    );

    // 2) Get FCM tokens for all users who have them
    const userFcmTokens = await UserFcmToken.find({
        user: { $in: userIds }
    });
    
    // 3) If there are users with FCM tokens, send push notifications
    if (userFcmTokens.length > 0) {
        const tokens = userFcmTokens.map(token => token.fcmToken);
        await sendPushNotificationToMany(
            tokens,
            title,
            body
        );
    }

    return notifications;
};

// @desc    Get notifications for a specific user
// @route   GET /api/mynotifications
// @access  Private
exports.getUserNotifications = asyncHandler(async (req, res, next) => {
    const notifications = await Notification.find({ user: req.user._id })
        .sort({ date: -1 }); // ترتيب تنازلي حسب التاريخ
    
    res.status(200).json({ data: notifications });
});

// @desc    Mark all unread notifications as read
// @route   PUT /api/mynotifications/mark-all-read
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
    const result = await Notification.updateMany(
        { 
            user: req.user._id,
            isRead: false 
        },
        { 
            isRead: true 
        }
    );

    res.status(200).json({ message: 'All notifications marked as read successfully' });
});

// @desc    Delete specific notification
// @route   DELETE /api/mynotifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
    });

    if (!notification) {
        return next(new ApiError('Notification not found', 404));
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
}); 