import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TracksScreen from '../screens/TracksScreen';
import MasteryMapScreen from '../screens/MasteryMapScreen';
import LearningBlockPlayerScreen from '../screens/LearningBlockPlayerScreen';
import AchievementCelebrationScreen from '../screens/AchievementCelebrationScreen';
import { TracksStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<TracksStackParamList>();

export default function TracksStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TracksList" component={TracksScreen} />
      <Stack.Screen name="MasteryMap" component={MasteryMapScreen} />
      <Stack.Screen name="LearningBlockPlayer" component={LearningBlockPlayerScreen} />
      <Stack.Screen
        name="AchievementCelebration"
        component={AchievementCelebrationScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
