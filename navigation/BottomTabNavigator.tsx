import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { IconButton } from 'react-native-paper';
import TrainingTracker from '../screens/TrainingTracker';
import Matches from '../screens/Matches';
<<<<<<< HEAD
import Stats from '../screens/Stats';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
=======
>>>>>>> aab2dc33b6c23749fa2ab93740ab8d1e6153f6cc

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'TrainingTracker') {
            iconName = 'dumbbell';
          } else if (route.name === 'Matches') {
            iconName = 'cricket';
<<<<<<< HEAD
          } else if (route.name === 'Stats') {
            iconName = 'chart-bar';
=======
>>>>>>> aab2dc33b6c23749fa2ab93740ab8d1e6153f6cc
          }

          return <IconButton icon={iconName} size={size} iconColor={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="TrainingTracker" 
        component={TrainingTracker}
        options={{ 
          title: 'Training',
          headerShown: false
        }}
      />
      <Tab.Screen 
        name="Matches" 
        component={Matches}
        options={{ 
          title: 'Matches',
          headerShown: false
        }}
      />
<<<<<<< HEAD
      <Tab.Screen 
        name="Stats" 
        component={Stats}
        options={{ 
          title: 'Stats',
          headerShown: false
        }}
      />
=======
>>>>>>> aab2dc33b6c23749fa2ab93740ab8d1e6153f6cc
    </Tab.Navigator>
  );
} 