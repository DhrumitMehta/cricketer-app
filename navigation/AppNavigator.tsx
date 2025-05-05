import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TrainingTracker from '../screens/TrainingTracker';
import AddTrainingSession from '../screens/AddTrainingSession';

export type RootStackParamList = {
  TrainingTracker: undefined;
  AddTrainingSession: { session?: {
    id: string;
    date: string;
    duration: number;
    focus_area: string;
    notes: string;
    created_at: string;
  }};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="TrainingTracker" 
          component={TrainingTracker}
          options={{ title: 'Training Tracker' }}
        />
        <Stack.Screen 
          name="AddTrainingSession" 
          component={AddTrainingSession}
          options={({ route }) => ({ 
            title: route.params?.session ? 'Edit Session' : 'New Session'
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 