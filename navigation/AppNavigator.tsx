import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IconButton } from 'react-native-paper';
import TrainingTracker from '../screens/TrainingTracker';
import AddTrainingSession from '../screens/AddTrainingSession';
import PlayerProfile from '../screens/PlayerProfile';
import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import Matches from '../screens/Matches';
import BottomTabNavigator from './BottomTabNavigator';
import { supabase } from '../lib/supabase';
<<<<<<< HEAD
import Stats from '../screens/Stats';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
=======
>>>>>>> aab2dc33b6c23749fa2ab93740ab8d1e6153f6cc

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Main: undefined;
  AddTrainingSession: { session?: any };
  PlayerProfile: undefined;
<<<<<<< HEAD
  Stats: undefined;
=======
>>>>>>> aab2dc33b6c23749fa2ab93740ab8d1e6153f6cc
};

const Stack = createNativeStackNavigator<RootStackParamList>();

<<<<<<< HEAD
const Tab = createBottomTabNavigator();

=======
>>>>>>> aab2dc33b6c23749fa2ab93740ab8d1e6153f6cc
export default function AppNavigator() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!session ? (
          <>
            <Stack.Screen 
              name="Login" 
              component={Login}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="SignUp" 
              component={SignUp}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Main" 
              component={BottomTabNavigator}
              options={({ navigation }) => ({
                headerShown: false,
              })}
            />
            <Stack.Screen 
              name="AddTrainingSession" 
              component={AddTrainingSession}
              options={{ title: 'Add Training Session' }}
            />
            <Stack.Screen 
              name="PlayerProfile" 
              component={PlayerProfile}
              options={{ title: 'Player Profile' }}
            />
<<<<<<< HEAD
            <Stack.Screen 
              name="Stats" 
              component={Stats}
              options={{
                title: 'Statistics',
              }}
            />
=======
>>>>>>> aab2dc33b6c23749fa2ab93740ab8d1e6153f6cc
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
<<<<<<< HEAD
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Matches"
        component={Matches}
        options={{
          tabBarLabel: 'Matches',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cricket" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={Stats}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Training"
        component={Training}
        options={{
          tabBarLabel: 'Training',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dumbbell" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={PlayerProfile}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
=======
>>>>>>> aab2dc33b6c23749fa2ab93740ab8d1e6153f6cc
} 