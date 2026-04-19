import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import TracksStackNavigator from './TracksStackNavigator';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { MainTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0818',
          borderTopWidth: 1,
          borderTopColor: '#1A1438',
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#7C5CFF',
        tabBarInactiveTintColor: '#3D2A6A',
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Tracks" component={TracksStackNavigator} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
