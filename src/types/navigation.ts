import { NavigatorScreenParams } from '@react-navigation/native';

export type TracksStackParamList = {
  TracksList: undefined;
  MasteryMap: { trackId: string; trackName: string };
  AddTrack: undefined;
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

export type MainTabParamList = {
  Dashboard: undefined;
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
};
