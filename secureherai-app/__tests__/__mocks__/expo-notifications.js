/**
 * Mock for expo-notifications in Node.js environment
 */
module.exports = {
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  NotificationTrigger: {
    TimeIntervalTrigger: jest.fn(),
    DateTrigger: jest.fn(),
  }
};
