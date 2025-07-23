const admin = require('../config/firebase');
const UserFcmToken = require('../models/userFcmTokenModel');

async function sendPushNotification(token, title, body, data = {}) {
  const message = {
    notification: { title, body },
    data,
    token,
  };

  try {
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    throw error;
  }
}

async function sendPushNotificationToMany(tokens, title, body, data = {}) {
  const message = {
    notification: { title, body },
    data,
    tokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    return response;
  } catch (error) {
    throw error;
  }
}

// get user fcm token by user id
async function getUserFcmToken(userId) {
  const userFcmToken = await UserFcmToken.findOne({ user: userId });
  if (!userFcmToken) {
    return null;
  }
  return userFcmToken;
}

module.exports = { sendPushNotification, sendPushNotificationToMany, getUserFcmToken };