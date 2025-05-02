import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { supabase } from '../lib/supabase';

interface TrainingSession {
  id: string;
  date: string;
  duration: number;
  focus_area: string;
  notes: string;
  created_at: string;
}

export default function TrainingTracker() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [newSession, setNewSession] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: '',
    focus_area: '',
    notes: '',
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return;
    }

    setSessions(data || []);
  };

  const handleAddSession = async () => {
    const { data, error } = await supabase
      .from('training_sessions')
      .insert([{
        date: newSession.date,
        duration: parseInt(newSession.duration),
        focus_area: newSession.focus_area,
        notes: newSession.notes,
      }]);

    if (error) {
      console.error('Error adding session:', error);
      return;
    }

    setNewSession({
      date: new Date().toISOString().split('T')[0],
      duration: '',
      focus_area: '',
      notes: '',
    });
    fetchSessions();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>New Training Session</Text>
        
        <TextInput
          label="Date"
          value={newSession.date}
          onChangeText={(text) => setNewSession({ ...newSession, date: text })}
          style={styles.input}
        />

        <TextInput
          label="Duration (minutes)"
          value={newSession.duration}
          onChangeText={(text) => setNewSession({ ...newSession, duration: text })}
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInput
          label="Focus Area"
          value={newSession.focus_area}
          onChangeText={(text) => setNewSession({ ...newSession, focus_area: text })}
          style={styles.input}
        />

        <TextInput
          label="Notes"
          value={newSession.notes}
          onChangeText={(text) => setNewSession({ ...newSession, notes: text })}
          multiline
          style={styles.input}
        />

        <Button mode="contained" onPress={handleAddSession} style={styles.button}>
          Add Session
        </Button>
      </View>

      <View style={styles.sessionsContainer}>
        <Text style={styles.title}>Recent Sessions</Text>
        {sessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <Text style={styles.sessionDate}>{session.date}</Text>
            <Text>Duration: {session.duration} minutes</Text>
            <Text>Focus: {session.focus_area}</Text>
            <Text>Notes: {session.notes}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    marginBottom: 24,
  },
  sessionsContainer: {
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
  },
  sessionCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  sessionDate: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
}); 