let admin;

function getAdmin() {
  if (admin) return admin;
  try {
    admin = require('firebase-admin');
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-service-account.json');
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    console.log('🔔 Firebase Admin initialised');
  } catch (err) {
    console.warn('⚠️  Firebase not configured:', err.message);
    admin = null;
  }
  return admin;
}

async function sendPush(fcmToken, title, body, data = {}) {
  if (!fcmToken) return;
  const fb = getAdmin();
  if (!fb) return;

  try {
    await fb.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: { ...data },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });
  } catch (err) {
    console.warn('⚠️  Push failed:', err.message);
  }
}

module.exports = { sendPush };
