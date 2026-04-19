import { NavigatorScreenParams } from '@react-navigation/native';

export type TracksStackParamList = {
  TracksList: undefined;
  MasteryMap: { trackId: string; trackName: string };
  LearningBlockPlayer: { lbId: number; lbTitle: string };
  AchievementCelebration: { lbId: number; lbTitle: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Tracks: NavigatorScreenParams<TracksStackParamList> | undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
};
