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
        const token = 'd2Co7309R9m1opi8ni3QpN:APA91bHLZMl_3DVR33aNy87yXIi8NGa5Q0GZ-qQ88MlHYtgPC5q_ee99htbYo6ADevJeF4kjPLPL3Y7ST0F2rYNE5S0uCUVsJ2XmjAdCnPzDt9pbQRqE-lg';
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
