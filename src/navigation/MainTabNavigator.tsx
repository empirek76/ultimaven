import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeStackNavigator from './HomeStackNavigator';
import TracksStackNavigator from './TracksStackNavigator';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { MainTabParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function MainTabNavigator() {
  const { isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#0D0D1A' : '#FFFFFF',
          borderTopColor: isDark ? '#2A2A4A' : '#E0E0F0',
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#6C47FF',
        tabBarInactiveTintColor: isDark ? '#6B6B8A' : '#9CA3AF',
        tabBarLabelStyle: {
          fontFamily: 'Poppins_400Regular',
          fontSize: 11,
          marginTop: -2,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons: Record<string, [IoniconName, IoniconName]> = {
            Dashboard:   ['home',           'home-outline'],
            Tracks:      ['grid',           'grid-outline'],
            Leaderboard: ['trophy',         'trophy-outline'],
            Profile:     ['person-circle',  'person-circle-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['home', 'home-outline'];
          return <Ionicons name={focused ? active : inactive} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeStackNavigator} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Tracks" component={TracksStackNavigator} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
