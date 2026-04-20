import React from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SignInScreen from '../screens/SignInScreen';
import MainTabNavigator from './MainTabNavigator';
import PaywallScreen from '../screens/PaywallScreen';
import NotificationPermissionScreen from '../screens/NotificationPermissionScreen';
import BlazeChatScreen from '../screens/BlazeChatScreen';
import CreatorSubmitScreen from '../screens/CreatorSubmitScreen';
import AdminScreen from '../screens/AdminScreen';
import MasteryMapScreen from '../screens/MasteryMapScreen';
import LearningBlockPlayerScreen from '../screens/LearningBlockPlayerScreen';
import AchievementCelebrationScreen from '../screens/AchievementCelebrationScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator({
  navRef,
}: {
  navRef?: React.RefObject<NavigationContainerRef<RootStackParamList> | null>;
}) {
  return (
    <NavigationContainer ref={navRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={HomeScreen} />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ animation: 'fade', animationDuration: 600 }}
        />
        <Stack.Screen
          name="NotificationPermission"
          component={NotificationPermissionScreen}
          options={{ animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{ animation: 'slide_from_bottom', gestureEnabled: true }}
        />
        <Stack.Screen
          name="BlazeChat"
          component={BlazeChatScreen}
          options={{ animation: 'slide_from_bottom', gestureEnabled: true }}
        />
        <Stack.Screen
          name="CreatorSubmit"
          component={CreatorSubmitScreen}
          options={{ animation: 'slide_from_bottom', gestureEnabled: true }}
        />
        <Stack.Screen
          name="AdminPanel"
          component={AdminScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="MasteryMap"
          component={MasteryMapScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="LearningBlockPlayer"
          component={LearningBlockPlayerScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="AchievementCelebration"
          component={AchievementCelebrationScreen}
          options={{ animation: 'fade', gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
