async function sendPush(expoPushToken, title, body, data = {}) {
  if (!expoPushToken) return;
  const isExpo = expoPushToken.startsWith('ExponentPushToken') || expoPushToken.startsWith('ExpoPushToken');
  if (!isExpo) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to: expoPushToken, title, body, data, sound: 'default', priority: 'high' }),
    });
  } catch (e) {
    console.error('[Push] send failed:', e.message);
  }
}

module.exports = { sendPush };
