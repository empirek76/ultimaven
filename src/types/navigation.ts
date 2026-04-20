import { NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
  DashboardHome: undefined;
};

export type TracksStackParamList = {
  TracksList: undefined;
  AddTrack: undefined;
};

export type MainTabParamList = {
  Dashboard: NavigatorScreenParams<HomeStackParamList> | undefined;
  Tracks: NavigatorScreenParams<TracksStackParamList> | undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignIn: undefined;
  NotificationPermission: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Paywall: { source?: 'lb_limit' | 'ai_mentor' | 'peer_review' | 'profile' } | undefined;
  BlazeChat: {
    trackId?: string;
    trackName?: string;
    trackEmoji?: string;
    lbTitle?: string;
  } | undefined;
  CreatorSubmit: undefined;
  AdminPanel: undefined;
  MasteryMap: { trackId: string; trackName?: string };
  LearningBlockPlayer: {
    lbId: number;
    lbTitle: string;
    lbNumber: number;
    lbDescription: string;
    trackId: string;
    trackEmoji: string;
    trackName: string;
    totalLBs: number;
  };
  AchievementCelebration: {
    lbId: number;
    lbTitle: string;
    lbNumber: number;
    trackId: string;
    trackEmoji: string;
    trackName: string;
    nextLbNumber: number;
    totalLBs: number;
    score?: number;
  };
};
