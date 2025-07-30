const express = require('express');
const {
    getUserNotifications,
    markAllAsRead,
    deleteNotification
} = require('../services/notificationService');
const { protect } = require('../services/authServices');

const router = express.Router();

router.route('/')
    .get(protect, getUserNotifications);

router.route('/mark-all-read')
    .put(protect, markAllAsRead);

router.route('/:id')
    .delete(protect, deleteNotification);

module.exports = router; 