import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { Button, Text, TextInput, Chip, IconButton, Card, MD3Colors } from 'react-native-paper';
import { Tab, TabView } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PlayerProfile'>;

const BAT_STYLES = ['RHB', 'LHB'];
const BOWL_STYLES = ['RAWS', 'RAOS', 'RAP', 'LAP', 'LAO', 'LAWS'];
const BAT_ROLES = ['Opener', 'Top Order', 'Middle Order', 'Finisher'];
const BOWL_ROLES = ['Opening Bowler', 'First Change', 'Middle Over Specialist', 'Death Specialist'];
const PLAY_ROLES = ['Batting All-rounder', 'Bowling All-rounder', 'Batter', 'WK-Batter', 'Bowler'];

// Add new interface for cumulative stats
interface CumulativeStats {
  batting: {
    matches: number;
    innings: number;
    runs: number;
    balls: number;
    average: number;
    strikeRate: number;
    highest: number;
    notOuts: number;
    fours: number;
    sixes: number;
    dots: number;
    dotPercentage: number;
    boundaryPercentage: number;
    ballsPerBoundary: number;
  };
  bowling: {
    matches: number;
    innings: number;
    balls: number;
    overs: number;
    maidens: number;
    runs: number;
    wickets: number;
    average: number;
    economy: number;
    strikeRate: number;
    bestFigures: string;
    dots: number;
    fours: number;
    sixes: number;
    wides: number;
    noBalls: number;
    dotPercentage: number;
    ballsPerBoundary: number;
  };
  fielding: {
    matches: number;
    infieldCatches: number;
    boundaryCatches: number;
    directRunouts: number;
    indirectRunouts: number;
    drops: number;
    playerOfMatch: number;
  };
}

export default function PlayerProfile() {
  const navigation = useNavigation<NavigationProp>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    dob: null as Date | null,
    batStyle: '',
    bowlStyle: '',
    batRoles: '',
    bowlRoles: '',
    playRole: '',
    favBatters: '',
    favBowlers: '',
    avatar_url: '',
  });
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'profile', title: 'Profile' },
    { key: 'stats', title: 'Statistics' },
  ]);
  const [stats, setStats] = useState<CumulativeStats>({
    batting: {
      matches: 0,
      innings: 0,
      runs: 0,
      balls: 0,
      average: 0,
      strikeRate: 0,
      highest: 0,
      notOuts: 0,
      fours: 0,
      sixes: 0,
      dots: 0,
      dotPercentage: 0,
      boundaryPercentage: 0,
      ballsPerBoundary: 0,
    },
    bowling: {
      matches: 0,
      innings: 0,
      balls: 0,
      overs: 0,
      maidens: 0,
      runs: 0,
      wickets: 0,
      average: 0,
      economy: 0,
      strikeRate: 0,
      bestFigures: '0/0',
      dots: 0,
      fours: 0,
      sixes: 0,
      wides: 0,
      noBalls: 0,
      dotPercentage: 0,
      ballsPerBoundary: 0,
    },
    fielding: {
      matches: 0,
      infieldCatches: 0,
      boundaryCatches: 0,
      directRunouts: 0,
      indirectRunouts: 0,
      drops: 0,
      playerOfMatch: 0,
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.goBack();
        return;
      }

      const { data, error } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          ...data,
          dob: data.dob ? new Date(data.dob) : null,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob: Date | null) => {
    if (!dob) return 'Not set';
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();

    if (days < 0) {
      months--;
      // Get the last day of the previous month
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const ageParts = [];
    if (years > 0) {
      ageParts.push(`${years} year${years !== 1 ? 's' : ''}`);
    }
    if (months > 0) {
      ageParts.push(`${months} month${months !== 1 ? 's' : ''}`);
    }
    if (days > 0) {
      ageParts.push(`${days} day${days !== 1 ? 's' : ''}`);
    }

    return ageParts.join(', ') || 'Less than a day';
  };

  const handleSaveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.goBack();
        return;
      }

      const { error } = await supabase
        .from('player_profiles')
        .upsert([{
          ...profile,
          user_id: user.id,
          dob: profile.dob?.toISOString() || '',
          batRoles: profile.batRoles,
          bowlRoles: profile.bowlRoles,
        }]);

      if (error) {
        console.error('Error saving profile:', error);
        return;
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleBatRole = (role: string) => {
    setProfile(prev => {
      const roles = prev.batRoles ? prev.batRoles.split(',') : [];
      const newRoles = roles.includes(role)
        ? roles.filter(r => r !== role)
        : [...roles, role];
      return {
        ...prev,
        batRoles: newRoles.join(',')
      };
    });
  };

  const toggleBowlRole = (role: string) => {
    setProfile(prev => {
      const roles = prev.bowlRoles ? prev.bowlRoles.split(',') : [];
      const newRoles = roles.includes(role)
        ? roles.filter(r => r !== role)
        : [...roles, role];
      return {
        ...prev,
        bowlRoles: newRoles.join(',')
      };
    });
  };

  const handleImagePick = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo' as const,
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', 'Failed to pick image');
        return;
      }

      if (response.assets && response.assets[0]) {
        uploadImage(response.assets[0]);
      }
    });
  };

  const uploadImage = async (imageAsset: any) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.goBack();
        return;
      }

      // Convert image to blob
      const response = await fetch(imageAsset.uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const fileExt = imageAsset.uri.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, blob);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('player_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Add function to fetch and calculate stats
  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: matches, error } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching matches:', error);
        return;
      }

      if (!matches) return;

      // Calculate cumulative stats
      const newStats: CumulativeStats = {
        batting: {
          matches: matches.length,
          innings: matches.filter(m => m.batting.balls > 0).length,
          runs: matches.reduce((sum, m) => sum + m.batting.runs, 0),
          balls: matches.reduce((sum, m) => sum + m.batting.balls, 0),
          average: 0, // Will calculate after
          strikeRate: 0, // Will calculate after
          highest: Math.max(...matches.map(m => m.batting.runs)),
          notOuts: matches.filter(m => m.batting.not_out).length,
          fours: matches.reduce((sum, m) => sum + m.batting.fours, 0),
          sixes: matches.reduce((sum, m) => sum + m.batting.sixes, 0),
          dots: matches.reduce((sum, m) => sum + m.batting.dots, 0),
          dotPercentage: 0, // Will calculate after
          boundaryPercentage: 0, // Will calculate after
          ballsPerBoundary: 0, // Will calculate after
        },
        bowling: {
          matches: matches.length,
          innings: matches.filter(m => m.bowling.balls > 0).length,
          balls: matches.reduce((sum, m) => sum + m.bowling.balls, 0),
          overs: Math.floor(matches.reduce((sum, m) => sum + m.bowling.balls, 0) / 6),
          maidens: matches.reduce((sum, m) => sum + m.bowling.maidens, 0),
          runs: matches.reduce((sum, m) => sum + m.bowling.runs, 0),
          wickets: matches.reduce((sum, m) => sum + m.bowling.wickets, 0),
          average: 0, // Will calculate after
          economy: 0, // Will calculate after
          strikeRate: 0, // Will calculate after
          bestFigures: '0/0', // Will calculate after
          dots: matches.reduce((sum, m) => sum + m.bowling.dots, 0),
          fours: matches.reduce((sum, m) => sum + m.bowling.fours, 0),
          sixes: matches.reduce((sum, m) => sum + m.bowling.sixes, 0),
          wides: matches.reduce((sum, m) => sum + (m.bowling_wides || 0), 0),
          noBalls: matches.reduce((sum, m) => sum + (m.bowling_noballs || 0), 0),
          dotPercentage: 0, // Will calculate after
          ballsPerBoundary: 0, // Will calculate after
        },
        fielding: {
          matches: matches.length,
          infieldCatches: matches.reduce((sum, m) => sum + m.fielding.infield_catches, 0),
          boundaryCatches: matches.reduce((sum, m) => sum + m.fielding.boundary_catches, 0),
          directRunouts: matches.reduce((sum, m) => sum + m.fielding.direct_runouts, 0),
          indirectRunouts: matches.reduce((sum, m) => sum + m.fielding.indirect_runouts, 0),
          drops: matches.reduce((sum, m) => sum + m.fielding.drops, 0),
          playerOfMatch: matches.filter(m => m.fielding.player_of_match).length,
        },
      };

      // Calculate derived stats
      const battingInnings = newStats.batting.innings;
      const battingDismissals = battingInnings - newStats.batting.notOuts;
      newStats.batting.average = battingDismissals > 0 ? newStats.batting.runs / battingDismissals : 0;
      newStats.batting.strikeRate = newStats.batting.balls > 0 ? (newStats.batting.runs / newStats.batting.balls) * 100 : 0;
      newStats.batting.dotPercentage = newStats.batting.balls > 0 ? (newStats.batting.dots / newStats.batting.balls) * 100 : 0;
      newStats.batting.boundaryPercentage = newStats.batting.runs > 0 ? 
        ((newStats.batting.fours * 4 + newStats.batting.sixes * 6) / newStats.batting.runs) * 100 : 0;
      newStats.batting.ballsPerBoundary = (newStats.batting.fours + newStats.batting.sixes) > 0 ? 
        newStats.batting.balls / (newStats.batting.fours + newStats.batting.sixes) : 0;

      const bowlingInnings = newStats.bowling.innings;
      newStats.bowling.average = newStats.bowling.wickets > 0 ? newStats.bowling.runs / newStats.bowling.wickets : 0;
      newStats.bowling.economy = newStats.bowling.balls > 0 ? (newStats.bowling.runs / newStats.bowling.balls) * 6 : 0;
      newStats.bowling.strikeRate = newStats.bowling.wickets > 0 ? newStats.bowling.balls / newStats.bowling.wickets : 0;
      newStats.bowling.dotPercentage = newStats.bowling.balls > 0 ? (newStats.bowling.dots / newStats.bowling.balls) * 100 : 0;
      newStats.bowling.ballsPerBoundary = (newStats.bowling.fours + newStats.bowling.sixes) > 0 ? 
        newStats.bowling.balls / (newStats.bowling.fours + newStats.bowling.sixes) : 0;

      // Calculate best bowling figures
      const bestBowling = matches
        .filter(m => m.bowling.wickets > 0)
        .sort((a, b) => {
          if (a.bowling.wickets !== b.bowling.wickets) {
            return b.bowling.wickets - a.bowling.wickets;
          }
          return a.bowling.runs - b.bowling.runs;
        })[0];

      if (bestBowling) {
        newStats.bowling.bestFigures = `${bestBowling.bowling.wickets}/${bestBowling.bowling.runs}`;
      }

      setStats(newStats);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Add useEffect to fetch stats
  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const renderProfileImage = () => (
    <View style={styles.profileImageContainer}>
      <View style={styles.profileImage}>
        {profile.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            style={styles.profileImageContent}
          />
        ) : (
          <IconButton
            icon="account"
            size={40}
            onPress={handleImagePick}
          />
        )}
        {isEditing && (
          <IconButton
            icon="camera"
            size={24}
            style={styles.cameraButton}
            onPress={handleImagePick}
          />
        )}
      </View>
      {uploading && (
        <ActivityIndicator style={styles.uploadIndicator} />
      )}
    </View>
  );

  const renderDisplayView = () => (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        {renderProfileImage()}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{profile.name}</Text>

            <Text style={styles.label}>Date of Birth</Text>
            <Text style={styles.value}>
              {profile.dob ? profile.dob.toLocaleDateString() : 'Not set'}
            </Text>

            <Text style={styles.label}>Age</Text>
            <Text style={styles.value}>{calculateAge(profile.dob)}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Playing Style</Text>
            <Text style={styles.label}>Batting Style</Text>
            <Text style={styles.value}>{profile.batStyle || 'Not set'}</Text>

            <Text style={styles.label}>Bowling Style</Text>
            <Text style={styles.value}>{profile.bowlStyle || 'Not set'}</Text>

            <Text style={styles.label}>Playing Role</Text>
            <Text style={styles.value}>{profile.playRole || 'Not set'}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Roles</Text>
            <Text style={styles.label}>Batting Roles</Text>
            <Text style={styles.value}>
              {profile.batRoles ? profile.batRoles.split(',').join(', ') : 'Not set'}
            </Text>

            <Text style={styles.label}>Bowling Roles</Text>
            <Text style={styles.value}>
              {profile.bowlRoles ? profile.bowlRoles.split(',').join(', ') : 'Not set'}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Favorites</Text>
            <Text style={styles.label}>Favorite Batters</Text>
            <Text style={styles.value}>{profile.favBatters || 'Not set'}</Text>

            <Text style={styles.label}>Favorite Bowlers</Text>
            <Text style={styles.value}>{profile.favBowlers || 'Not set'}</Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={() => setIsEditing(true)}
          style={styles.button}
        >
          Edit Profile
        </Button>
      </View>
    </ScrollView>
  );

  const renderEditView = () => (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        {renderProfileImage()}
        <TextInput
          label="Name"
          value={profile.name}
          onChangeText={(text) => setProfile({ ...profile, name: text })}
          style={styles.input}
        />

        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          style={styles.input}
        >
          {profile.dob ? profile.dob.toLocaleDateString() : 'Select Date of Birth'}
        </Button>
        {showDatePicker && (
          <DateTimePicker
            value={profile.dob || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setProfile({ ...profile, dob: selectedDate });
              }
            }}
          />
        )}

        <Text style={styles.ageText}>
          Age: {calculateAge(profile.dob)}
        </Text>

        <Text style={styles.sectionTitle}>Batting Style</Text>
        <View style={styles.chipGroup}>
          {BAT_STYLES.map((style) => (
            <Chip
              key={style}
              selected={profile.batStyle === style}
              onPress={() => setProfile({ ...profile, batStyle: style })}
              style={styles.chip}
            >
              {style}
            </Chip>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Bowling Style</Text>
        <View style={styles.chipGroup}>
          {BOWL_STYLES.map((style) => (
            <Chip
              key={style}
              selected={profile.bowlStyle === style}
              onPress={() => setProfile({ ...profile, bowlStyle: style })}
              style={styles.chip}
            >
              {style}
            </Chip>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Batting Roles</Text>
        <View style={styles.chipGroup}>
          {BAT_ROLES.map((role) => (
            <Chip
              key={role}
              selected={profile.batRoles.split(',').includes(role)}
              onPress={() => toggleBatRole(role)}
              style={styles.chip}
            >
              {role}
            </Chip>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Bowling Roles</Text>
        <View style={styles.chipGroup}>
          {BOWL_ROLES.map((role) => (
            <Chip
              key={role}
              selected={profile.bowlRoles.split(',').includes(role)}
              onPress={() => toggleBowlRole(role)}
              style={styles.chip}
            >
              {role}
            </Chip>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Playing Role</Text>
        <View style={styles.chipGroup}>
          {PLAY_ROLES.map((role) => (
            <Chip
              key={role}
              selected={profile.playRole === role}
              onPress={() => setProfile({ ...profile, playRole: role })}
              style={styles.chip}
            >
              {role}
            </Chip>
          ))}
        </View>

        <TextInput
          label="Favorite Batters"
          value={profile.favBatters}
          onChangeText={(text) => setProfile({ ...profile, favBatters: text })}
          multiline
          style={styles.input}
        />

        <TextInput
          label="Favorite Bowlers"
          value={profile.favBowlers}
          onChangeText={(text) => setProfile({ ...profile, favBowlers: text })}
          multiline
          style={styles.input}
        />

        <Button mode="contained" onPress={handleSaveProfile} style={styles.button}>
          Save Profile
        </Button>
        <Button mode="outlined" onPress={() => setIsEditing(false)} style={styles.button}>
          Cancel
        </Button>
      </View>
    </ScrollView>
  );

  // Add function to render stats view
  const renderStatsView = () => (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        {/* Batting Stats */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Batting Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Matches</Text>
                <Text style={styles.statValue}>{stats.batting.matches}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Innings</Text>
                <Text style={styles.statValue}>{stats.batting.innings}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Runs</Text>
                <Text style={styles.statValue}>{stats.batting.runs}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Average</Text>
                <Text style={styles.statValue}>{stats.batting.average.toFixed(2)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Strike Rate</Text>
                <Text style={styles.statValue}>{stats.batting.strikeRate.toFixed(2)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Highest</Text>
                <Text style={styles.statValue}>{stats.batting.highest}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Not Outs</Text>
                <Text style={styles.statValue}>{stats.batting.notOuts}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>4s</Text>
                <Text style={styles.statValue}>{stats.batting.fours}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>6s</Text>
                <Text style={styles.statValue}>{stats.batting.sixes}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Dot %</Text>
                <Text style={styles.statValue}>{stats.batting.dotPercentage.toFixed(1)}%</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Boundary %</Text>
                <Text style={styles.statValue}>{stats.batting.boundaryPercentage.toFixed(1)}%</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Balls/Boundary</Text>
                <Text style={styles.statValue}>{stats.batting.ballsPerBoundary.toFixed(1)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Bowling Stats */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Bowling Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Matches</Text>
                <Text style={styles.statValue}>{stats.bowling.matches}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Innings</Text>
                <Text style={styles.statValue}>{stats.bowling.innings}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Overs</Text>
                <Text style={styles.statValue}>{stats.bowling.overs}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Maidens</Text>
                <Text style={styles.statValue}>{stats.bowling.maidens}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Runs</Text>
                <Text style={styles.statValue}>{stats.bowling.runs}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Wickets</Text>
                <Text style={styles.statValue}>{stats.bowling.wickets}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Average</Text>
                <Text style={styles.statValue}>{stats.bowling.average.toFixed(2)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Economy</Text>
                <Text style={styles.statValue}>{stats.bowling.economy.toFixed(2)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Strike Rate</Text>
                <Text style={styles.statValue}>{stats.bowling.strikeRate.toFixed(2)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Best Figures</Text>
                <Text style={styles.statValue}>{stats.bowling.bestFigures}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Dot %</Text>
                <Text style={styles.statValue}>{stats.bowling.dotPercentage.toFixed(1)}%</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Balls/Boundary</Text>
                <Text style={styles.statValue}>{stats.bowling.ballsPerBoundary.toFixed(1)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Fielding Stats */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Fielding Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Matches</Text>
                <Text style={styles.statValue}>{stats.fielding.matches}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Infield Catches</Text>
                <Text style={styles.statValue}>{stats.fielding.infieldCatches}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Boundary Catches</Text>
                <Text style={styles.statValue}>{stats.fielding.boundaryCatches}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Direct Run Outs</Text>
                <Text style={styles.statValue}>{stats.fielding.directRunouts}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Indirect Run Outs</Text>
                <Text style={styles.statValue}>{stats.fielding.indirectRunouts}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Drops</Text>
                <Text style={styles.statValue}>{stats.fielding.drops}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Player of Match</Text>
                <Text style={styles.statValue}>{stats.fielding.playerOfMatch}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'profile':
        return isEditing ? renderEditView() : renderDisplayView();
      case 'stats':
        return renderStatsView();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={props => (
          <Tab.Bar
            {...props}
            style={styles.tabBar}
            indicatorStyle={styles.tabIndicator}
            activeColor={MD3Colors.primary40}
            inactiveColor={MD3Colors.neutral60}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  formContainer: {
    padding: 16,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImageContent: {
    width: '100%',
    height: '100%',
  },
  input: {
    marginBottom: 16,
  },
  ageText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    marginBottom: 8,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    margin: 0,
  },
  uploadIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    width: '30%',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tabBar: {
    backgroundColor: 'white',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabIndicator: {
    backgroundColor: '#2196F3',
  },
}); 