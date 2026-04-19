import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_ENABLED_KEY = 'notifications_enabled';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  console.log('[notificationService] requestPermissionsAsync called');
  const { status } = await Notifications.requestPermissionsAsync();
  console.log('[notificationService] permission status:', status);
  const granted = status === 'granted';
  if (granted) {
    await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'true');
    await scheduleAllNotifications();
    console.log('[notificationService] All notifications scheduled');
  }
  return granted;
}

export async function getNotificationsEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);
  return val === 'true';
}

export type SystemPermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function getSystemPermissionStatus(): Promise<SystemPermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as SystemPermissionStatus;
}

export async function enableNotifications(): Promise<void> {
  await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'true');
  await scheduleAllNotifications();
  console.log('[notificationService] Notifications enabled and scheduled');
}

export async function disableNotifications(): Promise<void> {
  await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'false');
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[notificationService] Notifications disabled and cancelled');
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await enableNotifications();
  } else {
    await disableNotifications();
  }
}

export async function scheduleAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await scheduleDailyStreakReminder();
  await scheduleMorningMotivation();
  await scheduleWeeklyReport();
}

async function scheduleDailyStreakReminder(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Keep your streak alive, Sri!',
      body: "Don't break your streak — just one LB keeps you in the game.",
      data: { screen: 'Dashboard' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

async function scheduleMorningMotivation(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🦅 Good morning, Sri!',
      body: "Blaze is ready when you are. Let's learn something today.",
      data: { screen: 'Dashboard' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });
}

async function scheduleWeeklyReport(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Your weekly mastery report is ready',
      body: "See how far you've come this week. Blaze is proud of you.",
      data: { screen: 'Dashboard' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 10,
      minute: 0,
    },
  });
}

export async function sendMilestoneNotification(
  type: 'streak_7' | 'track_50pct' | 'track_complete',
  trackName?: string
): Promise<void> {
  const enabled = await getNotificationsEnabled();
  if (!enabled) return;

  const content = {
    streak_7: {
      title: '🔥 7-Day Streak — Legendary!',
      body: "You've been learning for 7 days straight. Blaze salutes you! 🦅",
      data: { screen: 'Dashboard' },
    },
    track_50pct: {
      title: `🎯 Halfway through ${trackName ?? 'your track'}!`,
      body: "You're 50% done. The finish line is closer than you think. Keep going!",
      data: { screen: 'Tracks' },
    },
    track_complete: {
      title: `🏆 ${trackName ?? 'Track'} Complete!`,
      body: "You've mastered the entire track. Blaze is bursting with pride! 🦅",
      data: { screen: 'Tracks' },
    },
  }[type];

  await Notifications.scheduleNotificationAsync({
    content,
    trigger: null,
  });
}
