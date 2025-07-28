// Firebase configuration and initialization for web push notifications
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAt2Sl-8vw-POikjdd-8Rs8kdAHAEVj-k0",
  authDomain: "herai-f6be1.firebaseapp.com",
  projectId: "herai-f6be1",
  storageBucket: "herai-f6be1.firebasestorage.app",
  messagingSenderId: "277769538956",
  appId: "1:277769538956:web:38876d88304fe5389d5aa9"
};

// VAPID key for Web Push
const VAPID_KEY = "BCNlBRt-uYRjk5gLlIM1FKl62Xp5ARDA-bMpSQLrKqM_fEAAJkHNioEWI_ba28395qLcNVJMU83fLwk8klLGVyw";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: any = null;
let isMessagingSupported = false;

// Only initialize messaging for web platform
if (Platform.OS === 'web') {
  // Check if messaging is supported
  isSupported().then((supported) => {
    isMessagingSupported = supported;
    if (supported) {
      messaging = getMessaging(app);
      console.log('Firebase messaging initialized successfully');
    } else {
      console.log('Firebase messaging is not supported in this browser');
    }
  }).catch((error) => {
    console.error('Error checking messaging support:', error);
  });
}

/**
 * Request notification permission and get FCM registration token
 */
export const requestNotificationPermission = async (): Promise<{ success: boolean; token?: string; error?: string }> => {
  if (Platform.OS !== 'web' || !isMessagingSupported || !messaging) {
    return {
      success: false,
      error: 'Push notifications are only supported on web platform'
    };
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Get FCM registration token
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });
      
      if (currentToken) {
        console.log('FCM registration token:', currentToken);
        return {
          success: true,
          token: currentToken
        };
      } else {
        console.log('No registration token available.');
        return {
          success: false,
          error: 'No registration token available'
        };
      }
    } else if (permission === 'denied') {
      console.log('Notification permission denied.');
      return {
        success: false,
        error: 'Notification permission denied'
      };
    } else {
      console.log('Notification permission dismissed.');
      return {
        success: false,
        error: 'Notification permission not granted'
      };
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return {
      success: false,
      error: `Error requesting permission: ${error}`
    };
  }
};

/**
 * Get current FCM registration token
 */
export const getCurrentToken = async (): Promise<string | null> => {
  if (Platform.OS !== 'web' || !isMessagingSupported || !messaging) {
    console.log('Push notifications are only supported on web platform');
    return null;
  }

  try {
    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY
    });
    
    if (currentToken) {
      console.log('Current FCM token:', currentToken);
      return currentToken;
    } else {
      console.log('No registration token available.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
};

/**
 * Set up foreground message handler
 */
export const setupForegroundMessageHandler = () => {
  if (Platform.OS !== 'web' || !isMessagingSupported || !messaging) {
    console.log('Push notifications are only supported on web platform');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    
    // Extract notification data
    const { title, body } = payload.notification || {};
    const data = payload.data || {};
    
    // Show custom notification or handle as needed
    if (title && body) {
      // You can customize this based on your app's needs
      showCustomNotification(title, body, data);
    }
  });
};

/**
 * Show custom notification (you can customize this)
 */
const showCustomNotification = (title: string, body: string, data: any) => {
  // For web platform, you might want to show a custom in-app notification
  // or use the browser's notification API
  
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: body,
      icon: '/assets/images/notification_icon.png', // Make sure this icon exists
      badge: '/assets/images/badge_icon.png',
      tag: data.alertId || 'emergency-alert',
      requireInteraction: true // Keep notification visible until user interacts
    });

    notification.onclick = () => {
      // Handle notification click
      window.focus();
      if (data.alertId) {
        // Navigate to specific alert or take appropriate action
        console.log('Notification clicked for alert:', data.alertId);
      }
      notification.close();
    };
    
    // Auto-close after 10 seconds for non-emergency notifications
    if (!data.alertId) {
      setTimeout(() => {
        notification.close();
      }, 10000);
    }
  }
};

/**
 * Send push notification to specific FCM tokens
 * This function sends notifications directly via Firebase HTTP API
 */
export const sendPushNotificationToTokens = async (
  tokens: string[], 
  title: string, 
  body: string, 
  data?: Record<string, string>
): Promise<{ success: boolean; error?: string }> => {
  try {
    // For web push notifications, we'll use Firebase HTTP v1 API
    // This requires a server key or service account, but for web we can use the legacy API
    
    const SERVER_KEY = "YOUR_FIREBASE_SERVER_KEY"; // You'll need to get this from Firebase Console
    
    const notifications = tokens.map(token => ({
      to: token,
      notification: {
        title: title,
        body: body,
        icon: '/assets/images/notification_icon.png',
        badge: '/assets/images/badge_icon.png',
        requireInteraction: true,
        tag: data?.alertId || 'emergency-alert'
      },
      data: data || {},
      webpush: {
        headers: {
          TTL: "300", // 5 minutes
          Urgency: "high"
        },
        notification: {
          title: title,
          body: body,
          icon: '/assets/images/notification_icon.png',
          badge: '/assets/images/badge_icon.png',
          requireInteraction: true,
          tag: data?.alertId || 'emergency-alert',
          actions: [
            {
              action: 'accept',
              title: 'Accept Alert',
              icon: '/assets/images/accept_icon.png'
            },
            {
              action: 'ignore', 
              title: 'Ignore',
              icon: '/assets/images/ignore_icon.png'
            }
          ]
        }
      }
    }));

    // Send to Firebase FCM endpoint
    const promises = notifications.map(notification => 
      fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${SERVER_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notification)
      })
    );

    const responses = await Promise.all(promises);
    const successful = responses.filter(r => r.ok).length;
    
    console.log(`Sent ${successful}/${tokens.length} push notifications successfully`);
    
    return {
      success: successful > 0,
      error: successful === 0 ? 'Failed to send any notifications' : undefined
    };
    
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return {
      success: false,
      error: `Failed to send notifications: ${error}`
    };
  }
};

/**
 * Send SOS alert push notification to responders
 * This is the main function you'll call when SOS is triggered
 */
export const sendSOSAlertToResponders = async (
  responderTokens: string[],
  alertData: {
    alertId: string;
    userLocation: string;
    userName: string;
    alertMessage?: string;
    latitude?: number;
    longitude?: number;
  }
): Promise<{ success: boolean; error?: string }> => {
  const title = '🚨 EMERGENCY ALERT';
  const body = `Emergency assistance needed from ${alertData.userName} at ${alertData.userLocation}${alertData.alertMessage ? '. ' + alertData.alertMessage : ''}`;
  
  const data = {
    alertId: alertData.alertId,
    type: 'SOS_ALERT',
    latitude: alertData.latitude?.toString() || '',
    longitude: alertData.longitude?.toString() || '',
    userLocation: alertData.userLocation,
    userName: alertData.userName,
    alertMessage: alertData.alertMessage || '',
    timestamp: Date.now().toString()
  };

  return await sendPushNotificationToTokens(responderTokens, title, body, data);
};
export const isPushNotificationSupported = (): boolean => {
  return Platform.OS === 'web' && 
         isMessagingSupported && 
         'Notification' in window && 
         'serviceWorker' in navigator;
};

/**
 * Check current notification permission status
 */
export const getNotificationPermissionStatus = (): string => {
  if (Platform.OS !== 'web' || !('Notification' in window)) {
    return 'unsupported';
  }
  
  return Notification.permission;
};

export { messaging, app };
