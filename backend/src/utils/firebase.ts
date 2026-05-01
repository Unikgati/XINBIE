import admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin SDK
// Uses GOOGLE_APPLICATION_CREDENTIALS env var or service account JSON
let firebaseInitialized = false;

export function initFirebase() {
  if (firebaseInitialized) return;

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (serviceAccountPath) {
      const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const serviceAccount = require(absolutePath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } else {
      console.warn('[Firebase] No credentials found. Push notifications disabled.');
      return;
    }

    firebaseInitialized = true;
    console.log('[Firebase] Admin SDK initialized');
  } catch (error) {
    console.error('[Firebase] Init failed:', error);
  }
}

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send push notification to a single device.
 */
export async function sendPushNotification(
  fcmToken: string,
  payload: PushPayload
): Promise<boolean> {
  if (!firebaseInitialized) return false;

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          channelId: payload.data?.type === 'new_order' ? 'driver_orders' : 'general',
          sound: 'default',
        },
      },
    });
    return true;
  } catch (error: any) {
    if (error?.code === 'messaging/registration-token-not-registered') {
      console.warn(`[FCM] Token expired: ${fcmToken.slice(0, 20)}...`);
    } else {
      console.error('[FCM] Send failed:', error);
    }
    return false;
  }
}

/**
 * Send push to multiple devices.
 */
export async function sendPushToMultiple(
  fcmTokens: string[],
  payload: PushPayload
): Promise<void> {
  if (!firebaseInitialized || fcmTokens.length === 0) return;

  const messages = fcmTokens.map((token) => ({
    token,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data,
    android: {
      priority: 'high' as const,
      notification: {
        channelId: payload.data?.type === 'new_order' ? 'driver_orders' : 'general',
        sound: 'default',
      },
    },
  }));

  try {
    const result = await admin.messaging().sendEach(messages);
    console.log(`[FCM] Sent ${result.successCount}/${messages.length}`);
  } catch (error) {
    console.error('[FCM] Batch send failed:', error);
  }
}

/**
 * Send push to topic (e.g. 'driver_all').
 */
export async function sendPushToTopic(
  topic: string,
  payload: PushPayload
): Promise<boolean> {
  if (!firebaseInitialized) return false;

  try {
    await admin.messaging().send({
      topic,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          channelId: payload.data?.type === 'new_order' ? 'driver_orders' : 'general',
          sound: 'default',
        },
      },
    });
    return true;
  } catch (error) {
    console.error('[FCM] Topic send failed:', error);
    return false;
  }
}
