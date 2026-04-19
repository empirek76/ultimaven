import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SignInScreen from '../screens/SignInScreen';
import MainTabNavigator from './MainTabNavigator';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
