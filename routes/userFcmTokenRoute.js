const express = require('express');
const router = express.Router();
const { saveFcmToken, deleteFcmToken } = require('../services/userFcmToken');
const { protect } = require('../services/authServices');
const { sendPushNotification } = require('../utils/sendPushNotification');

router.post('/', protect, saveFcmToken);
router.delete('/', protect, deleteFcmToken);


// Test notification endpoint
router.get('/test-notification', protect, async (req, res) => {
    try {
        const token = 'ckw69WQsT1GXklaVzNBr9a:APA91bF_jIWGwQ1HjRYl1nrtPuox86oJqt3R71gIjxSZ-TSLgayNwxgM20K1hxiLzz6JLjsr-tApqloCZ4IwL4QnDK3DbDeXJ_7Ikz2EelRoIPQkT1waqH8';
        const response = await sendPushNotification(
            token,
            'Test Notification',
            'This is a test notification from Travelux!'
        );
        res.json({ success: true, response });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
