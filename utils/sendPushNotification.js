const admin = require('../config/firebase');
const UserFcmToken = require('../models/userFcmTokenModel');

async function sendPushNotification(token, title, body, data = {}) {
  const message = {
    notification: { 
      title, 
      body 
    },
    data: {
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'high_importance_channel',
        priority: 'high'
      }
    },
    apns: {
      payload: {
        aps: {
          'content-available': 1,
          sound: 'default'
        }
      },
      headers: {
        'apns-push-type': 'background',
        'apns-priority': '5'
      }
    },
    token
  };

  try {
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    console.log(error);
  }
}

async function sendPushNotificationToMany(tokens, title, body, data = {}) {
  const message = {
    notification: { 
      title, 
      body 
    },
    data: {
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'high_importance_channel',
        priority: 'high'
      }
    },
    apns: {
      payload: {
        aps: {
          'content-available': 1,
          sound: 'default'
        }
      },
      headers: {
        'apns-push-type': 'background',
        'apns-priority': '5'
      }
    },
    tokens
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