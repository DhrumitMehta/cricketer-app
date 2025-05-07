import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, StatusBar, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Menu, Divider, Portal, Dialog } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Stats'>;

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
    fifties: number;
    hundreds: number;
    avgPosition: number;
    highestMatchId: string;
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
    ballsPerWide: number;
    ballsPerNoBall: number;
    boundaryPercentage: number;
  };
  fielding: {
    matches: number;
    infieldCatches: number;
    boundaryCatches: number;
    directRunouts: number;
    indirectRunouts: number;
    drops: number;
    playerOfMatch: number;
    contributionsPerMatch: number;
    dropsPerMatch: number;
  };
}

interface FilterState {
  format: 'All' | 'T20' | 'ODI' | 'T10' | 'Other';
  year: 'All' | string;
  venue: 'All' | string;
  opposition: 'All' | string;
  result: 'All' | 'Won' | 'Lost' | 'Draw' | 'Tie';
  battingPosition: 'All' | number;
  bowlingPosition: 'All' | number;
}

const safeToFixed = (value: number | undefined, digits: number = 1): string => {
  if (value === undefined || isNaN(value)) return '0.0';
  return value.toFixed(digits);
};

const Stats = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
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
      fifties: 0,
      hundreds: 0,
      avgPosition: 0,
      highestMatchId: '',
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
      ballsPerWide: 0,
      ballsPerNoBall: 0,
      boundaryPercentage: 0,
    },
    fielding: {
      matches: 0,
      infieldCatches: 0,
      boundaryCatches: 0,
      directRunouts: 0,
      indirectRunouts: 0,
      drops: 0,
      playerOfMatch: 0,
      contributionsPerMatch: 0,
      dropsPerMatch: 0,
    },
  });

  const [filters, setFilters] = useState<FilterState>({
    format: 'All',
    year: 'All',
    venue: 'All',
    opposition: 'All',
    result: 'All',
    battingPosition: 'All',
    bowlingPosition: 'All'
  });

  const [formatMenuVisible, setFormatMenuVisible] = useState(false);
  const [yearMenuVisible, setYearMenuVisible] = useState(false);
  const [venueMenuVisible, setVenueMenuVisible] = useState(false);
  const [oppositionMenuVisible, setOppositionMenuVisible] = useState(false);
  const [resultMenuVisible, setResultMenuVisible] = useState(false);
  const [battingPositionMenuVisible, setBattingPositionMenuVisible] = useState(false);
  const [bowlingPositionMenuVisible, setBowlingPositionMenuVisible] = useState(false);

  const [uniqueYears, setUniqueYears] = useState<string[]>([]);
  const [uniqueVenues, setUniqueVenues] = useState<string[]>([]);
  const [uniqueOppositions, setUniqueOppositions] = useState<string[]>([]);

  const [showMatchDetails, setShowMatchDetails] = useState<{
    type: 'highest' | 'fifty' | 'hundred' | 'notOut' | null;
    matchIds: string[];
  }>({ type: null, matchIds: [] });

  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.goBack();
        return;
      }

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
        return;
      }

      // Store the matches data
      setMatches(matchesData || []);

      // Apply filters
      let filtered = matchesData || [];
      if (filters.format !== 'All') {
        filtered = filtered.filter(match => match.match_format === filters.format);
      }
      if (filters.year !== 'All') {
        filtered = filtered.filter(match => new Date(match.date).getFullYear().toString() === filters.year);
      }
      if (filters.venue !== 'All') {
        filtered = filtered.filter(match => match.venue === filters.venue);
      }
      if (filters.opposition !== 'All') {
        filtered = filtered.filter(match => match.opponent === filters.opposition);
      }
      if (filters.result !== 'All') {
        filtered = filtered.filter(match => match.result === filters.result);
      }
      if (filters.battingPosition !== 'All') {
        filtered = filtered.filter(match => match.batting.position.toString() === filters.battingPosition);
      }
      if (filters.bowlingPosition !== 'All') {
        filtered = filtered.filter(match => match.bowling.position.toString() === filters.bowlingPosition);
      }

      // Update filtered matches
      setFilteredMatches(filtered);

      // Calculate stats from filtered matches
      const newStats: CumulativeStats = {
        batting: {
          matches: filtered.length,
          runs: filtered.reduce((sum, match) => sum + match.batting.runs, 0),
          balls: filtered.reduce((sum, match) => sum + match.batting.balls, 0),
          average: filtered.length > 0 ? 
            filtered.reduce((sum, match) => sum + match.batting.runs, 0) / 
            filtered.filter(match => !match.batting.not_out).length : 0,
          strike_rate: filtered.reduce((sum, match) => sum + match.batting.balls, 0) > 0 ?
            (filtered.reduce((sum, match) => sum + match.batting.runs, 0) * 100) /
            filtered.reduce((sum, match) => sum + match.batting.balls, 0) : 0,
          highest: Math.max(...filtered.map(match => match.batting.runs)),
          highestMatchId: filtered.reduce((highest, current) => 
            current.batting.runs > highest.batting.runs ? current : highest
          ).id,
          not_outs: filtered.filter(match => match.batting.not_out).length,
          dots: filtered.reduce((sum, match) => sum + match.batting.dots, 0),
          singles: filtered.reduce((sum, match) => sum + match.batting.singles, 0),
          doubles: filtered.reduce((sum, match) => sum + match.batting.doubles, 0),
          triples: filtered.reduce((sum, match) => sum + match.batting.triples, 0),
          fours: filtered.reduce((sum, match) => sum + match.batting.fours, 0),
          sixes: filtered.reduce((sum, match) => sum + match.batting.sixes, 0),
          dot_percentage: filtered.reduce((sum, match) => sum + match.batting.balls, 0) > 0 ?
            (filtered.reduce((sum, match) => sum + match.batting.dots, 0) * 100) /
            filtered.reduce((sum, match) => sum + match.batting.balls, 0) : 0,
          boundary_percentage: filtered.reduce((sum, match) => sum + match.batting.runs, 0) > 0 ?
            ((filtered.reduce((sum, match) => sum + match.batting.fours, 0) * 4 +
              filtered.reduce((sum, match) => sum + match.batting.sixes, 0) * 6) * 100) /
            filtered.reduce((sum, match) => sum + match.batting.runs, 0) : 0,
          balls_per_boundary: (filtered.reduce((sum, match) => sum + match.batting.fours, 0) +
            filtered.reduce((sum, match) => sum + match.batting.sixes, 0)) > 0 ?
            filtered.reduce((sum, match) => sum + match.batting.balls, 0) /
            (filtered.reduce((sum, match) => sum + match.batting.fours, 0) +
              filtered.reduce((sum, match) => sum + match.batting.sixes, 0)) : 0
        },
        bowling: {
          matches: filtered.length,
          innings: filtered.filter(m => m.bowling.balls > 0).length,
          balls: filtered.reduce((sum, m) => sum + m.bowling.balls, 0),
          overs: Math.floor(filtered.reduce((sum, m) => sum + m.bowling.balls, 0) / 6),
          maidens: filtered.reduce((sum, m) => sum + m.bowling.maidens, 0),
          runs: filtered.reduce((sum, m) => sum + m.bowling.runs, 0),
          wickets: filtered.reduce((sum, m) => sum + m.bowling.wickets, 0),
          average: 0,
          economy: 0,
          strikeRate: 0,
          bestFigures: '0/0',
          dots: filtered.reduce((sum, m) => sum + m.bowling.dots, 0),
          fours: filtered.reduce((sum, m) => sum + m.bowling.fours, 0),
          sixes: filtered.reduce((sum, m) => sum + m.bowling.sixes, 0),
          wides: filtered.reduce((sum, m) => sum + (m.bowling_wides || 0), 0),
          noBalls: filtered.reduce((sum, m) => sum + (m.bowling_noballs || 0), 0),
          dotPercentage: 0,
          ballsPerBoundary: 0,
          ballsPerWide: 0,
          ballsPerNoBall: 0,
          boundaryPercentage: 0,
        },
        fielding: {
          matches: filtered.length,
          infieldCatches: filtered.reduce((sum, m) => sum + m.fielding.infield_catches, 0),
          boundaryCatches: filtered.reduce((sum, m) => sum + m.fielding.boundary_catches, 0),
          directRunouts: filtered.reduce((sum, m) => sum + m.fielding.direct_runouts, 0),
          indirectRunouts: filtered.reduce((sum, m) => sum + m.fielding.indirect_runouts, 0),
          drops: filtered.reduce((sum, m) => sum + m.fielding.drops, 0),
          playerOfMatch: filtered.filter(m => m.fielding.player_of_match).length,
          contributionsPerMatch: 0,
          dropsPerMatch: 0,
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
      const bestBowling = filtered
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

      const totalBalls = newStats.bowling.balls;
      const totalWides = newStats.bowling.wides;
      const totalNoBalls = newStats.bowling.noBalls;
      const totalRuns = newStats.bowling.runs;
      const totalBoundaryRuns = (newStats.bowling.fours * 4) + (newStats.bowling.sixes * 6);

      // Calculate balls per wide
      newStats.bowling.ballsPerWide = totalWides > 0 ? totalBalls / totalWides : 0;

      // Calculate balls per no-ball
      newStats.bowling.ballsPerNoBall = totalNoBalls > 0 ? totalBalls / totalNoBalls : 0;

      // Calculate boundary percentage
      newStats.bowling.boundaryPercentage = totalRuns > 0 ? 
        (totalBoundaryRuns / totalRuns) * 100 : 0;

      // Calculate fielding contributions per match
      const totalContributions = newStats.fielding.infieldCatches + 
                               newStats.fielding.boundaryCatches + 
                               newStats.fielding.directRunouts + 
                               newStats.fielding.indirectRunouts;
      
      newStats.fielding.contributionsPerMatch = newStats.fielding.matches > 0 ? 
        totalContributions / newStats.fielding.matches : 0;

      // Calculate drops per match
      newStats.fielding.dropsPerMatch = newStats.fielding.matches > 0 ? 
        newStats.fielding.drops / newStats.fielding.matches : 0;

      console.log('Fielding stats:', newStats.fielding);

      setStats(newStats);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMatchDetails = (match: Match) => {
    const date = new Date(match.date);
    return `${date.toLocaleDateString()} vs ${match.opponent} at ${match.venue}`;
  };

  const getMilestoneMatches = (type: 'fifty' | 'hundred' | 'notOut') => {
    return filteredMatches.filter(match => {
      switch (type) {
        case 'fifty':
          return match.batting.runs >= 50 && match.batting.runs < 100;
        case 'hundred':
          return match.batting.runs >= 100;
        case 'notOut':
          return match.batting.not_out;
        default:
          return false;
      }
    });
  };

  const handleStatPress = (type: 'highest' | 'fifty' | 'hundred' | 'notOut', matchId?: string) => {
    if (type === 'highest' && matchId) {
      setShowMatchDetails({ type, matchIds: [matchId] });
    } else {
      const milestoneMatches = getMilestoneMatches(type as 'fifty' | 'hundred' | 'notOut');
      setShowMatchDetails({ 
        type, 
        matchIds: milestoneMatches.map(match => match.id)
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          {/* Filter Section */}
          <Card style={styles.filterCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Filters</Text>
              <View style={styles.filterGrid}>
                {/* Format Filter */}
                <Menu
                  visible={formatMenuVisible}
                  onDismiss={() => setFormatMenuVisible(false)}
                  anchor={
                    <Button 
                      mode="outlined" 
                      onPress={() => setFormatMenuVisible(true)}
                      style={styles.filterButton}
                    >
                      Format: {filters.format}
                    </Button>
                  }
                >
                  <Menu.Item onPress={() => { setFilters({...filters, format: 'All'}); setFormatMenuVisible(false); }} title="All" />
                  <Menu.Item onPress={() => { setFilters({...filters, format: 'T20'}); setFormatMenuVisible(false); }} title="T20" />
                  <Menu.Item onPress={() => { setFilters({...filters, format: 'ODI'}); setFormatMenuVisible(false); }} title="ODI" />
                  <Menu.Item onPress={() => { setFilters({...filters, format: 'T10'}); setFormatMenuVisible(false); }} title="T10" />
                  <Menu.Item onPress={() => { setFilters({...filters, format: 'Other'}); setFormatMenuVisible(false); }} title="Other" />
                </Menu>

                {/* Year Filter */}
                <Menu
                  visible={yearMenuVisible}
                  onDismiss={() => setYearMenuVisible(false)}
                  anchor={
                    <Button 
                      mode="outlined" 
                      onPress={() => setYearMenuVisible(true)}
                      style={styles.filterButton}
                    >
                      Year: {filters.year}
                    </Button>
                  }
                >
                  <Menu.Item onPress={() => { setFilters({...filters, year: 'All'}); setYearMenuVisible(false); }} title="All" />
                  {uniqueYears.map(year => (
                    <Menu.Item 
                      key={year}
                      onPress={() => { setFilters({...filters, year}); setYearMenuVisible(false); }} 
                      title={year}
                    />
                  ))}
                </Menu>

                {/* Venue Filter */}
                <Menu
                  visible={venueMenuVisible}
                  onDismiss={() => setVenueMenuVisible(false)}
                  anchor={
                    <Button 
                      mode="outlined" 
                      onPress={() => setVenueMenuVisible(true)}
                      style={styles.filterButton}
                    >
                      Venue: {filters.venue}
                    </Button>
                  }
                >
                  <Menu.Item onPress={() => { setFilters({...filters, venue: 'All'}); setVenueMenuVisible(false); }} title="All" />
                  {uniqueVenues.map(venue => (
                    <Menu.Item 
                      key={venue}
                      onPress={() => { setFilters({...filters, venue}); setVenueMenuVisible(false); }} 
                      title={venue}
                    />
                  ))}
                </Menu>

                {/* Opposition Filter */}
                <Menu
                  visible={oppositionMenuVisible}
                  onDismiss={() => setOppositionMenuVisible(false)}
                  anchor={
                    <Button 
                      mode="outlined" 
                      onPress={() => setOppositionMenuVisible(true)}
                      style={styles.filterButton}
                    >
                      Opposition: {filters.opposition}
                    </Button>
                  }
                >
                  <Menu.Item onPress={() => { setFilters({...filters, opposition: 'All'}); setOppositionMenuVisible(false); }} title="All" />
                  {uniqueOppositions.map(opposition => (
                    <Menu.Item 
                      key={opposition}
                      onPress={() => { setFilters({...filters, opposition}); setOppositionMenuVisible(false); }} 
                      title={opposition}
                    />
                  ))}
                </Menu>

                {/* Result Filter */}
                <Menu
                  visible={resultMenuVisible}
                  onDismiss={() => setResultMenuVisible(false)}
                  anchor={
                    <Button 
                      mode="outlined" 
                      onPress={() => setResultMenuVisible(true)}
                      style={styles.filterButton}
                    >
                      Result: {filters.result}
                    </Button>
                  }
                >
                  <Menu.Item onPress={() => { setFilters({...filters, result: 'All'}); setResultMenuVisible(false); }} title="All" />
                  <Menu.Item onPress={() => { setFilters({...filters, result: 'Won'}); setResultMenuVisible(false); }} title="Won" />
                  <Menu.Item onPress={() => { setFilters({...filters, result: 'Lost'}); setResultMenuVisible(false); }} title="Lost" />
                  <Menu.Item onPress={() => { setFilters({...filters, result: 'Draw'}); setResultMenuVisible(false); }} title="Draw" />
                  <Menu.Item onPress={() => { setFilters({...filters, result: 'Tie'}); setResultMenuVisible(false); }} title="Tie" />
                </Menu>

                {/* Batting Position Filter */}
                <Menu
                  visible={battingPositionMenuVisible}
                  onDismiss={() => setBattingPositionMenuVisible(false)}
                  anchor={
                    <Button 
                      mode="outlined" 
                      onPress={() => setBattingPositionMenuVisible(true)}
                      style={styles.filterButton}
                    >
                      Batting Position: {filters.battingPosition}
                    </Button>
                  }
                >
                  <Menu.Item 
                    onPress={() => { 
                      setFilters({...filters, battingPosition: 'All'}); 
                      setBattingPositionMenuVisible(false); 
                    }} 
                    title="All" 
                  />
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(position => (
                    <Menu.Item 
                      key={position}
                      onPress={() => { 
                        setFilters({...filters, battingPosition: position}); 
                        setBattingPositionMenuVisible(false); 
                      }} 
                      title={`Position ${position}`}
                    />
                  ))}
                </Menu>

                {/* Bowling Position Filter */}
                <Menu
                  visible={bowlingPositionMenuVisible}
                  onDismiss={() => setBowlingPositionMenuVisible(false)}
                  anchor={
                    <Button 
                      mode="outlined" 
                      onPress={() => setBowlingPositionMenuVisible(true)}
                      style={styles.filterButton}
                    >
                      Bowling Position: {filters.bowlingPosition}
                    </Button>
                  }
                >
                  <Menu.Item 
                    onPress={() => { 
                      setFilters({...filters, bowlingPosition: 'All'}); 
                      setBowlingPositionMenuVisible(false); 
                    }} 
                    title="All" 
                  />
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(position => (
                    <Menu.Item 
                      key={position}
                      onPress={() => { 
                        setFilters({...filters, bowlingPosition: position}); 
                        setBowlingPositionMenuVisible(false); 
                      }} 
                      title={`Position ${position}`}
                    />
                  ))}
                </Menu>
              </View>
            </Card.Content>
          </Card>

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
                  <Text style={styles.statValue}>{safeToFixed(stats.batting.average)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Strike Rate</Text>
                  <Text style={styles.statValue}>{safeToFixed(stats.batting.strike_rate)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.statItem}
                  onPress={() => handleStatPress('highest', stats.batting.highestMatchId)}
                >
                  <Text style={styles.statLabel}>Highest</Text>
                  <Text style={[styles.statValue, styles.hyperlink]}>
                    {stats.batting.highest}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.statItem}
                  onPress={() => handleStatPress('fifty')}
                >
                  <Text style={styles.statLabel}>50s</Text>
                  <Text style={[styles.statValue, styles.hyperlink]}>
                    {filteredMatches.filter(m => m.batting.runs >= 50 && m.batting.runs < 100).length}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.statItem}
                  onPress={() => handleStatPress('hundred')}
                >
                  <Text style={styles.statLabel}>100s</Text>
                  <Text style={[styles.statValue, styles.hyperlink]}>
                    {filteredMatches.filter(m => m.batting.runs >= 100).length}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.statItem}
                  onPress={() => handleStatPress('notOut')}
                >
                  <Text style={styles.statLabel}>Not Outs</Text>
                  <Text style={[styles.statValue, styles.hyperlink]}>
                    {filteredMatches.filter(m => m.batting.not_out).length}
                  </Text>
                </TouchableOpacity>
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
                  <Text style={styles.statValue}>{safeToFixed(stats.batting.dot_percentage)}%</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Bdry Run %</Text>
                  <Text style={styles.statValue}>{safeToFixed(stats.batting.boundary_percentage)}%</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Balls/Bdry</Text>
                  <Text style={styles.statValue}>{safeToFixed(stats.batting.balls_per_boundary)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Avg Position</Text>
                  <Text style={styles.statValue}>{stats.batting.avgPosition.toFixed(1)}</Text>
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
                  <Text style={styles.statValue}>{safeToFixed(stats.bowling.average)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Economy</Text>
                  <Text style={styles.statValue}>{safeToFixed(stats.bowling.economy)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Strike Rate</Text>
                  <Text style={styles.statValue}>{safeToFixed(stats.bowling.strikeRate)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Best Figures</Text>
                  <Text style={styles.statValue}>{stats.bowling.bestFigures}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Dot %</Text>
                  <Text style={styles.statValue}>{safeToFixed(stats.bowling.dotPercentage)}%</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Bdry Run %</Text>
                  <Text style={styles.statValue}>{safeToFixed(stats.bowling.boundaryPercentage)}%</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Balls/Bdry</Text>
                  <Text style={styles.statValue}>{safeToFixed(stats.bowling.ballsPerBoundary)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Balls/Wide</Text>
                  <Text style={styles.statValue}>{safeToFixed(stats.bowling.ballsPerWide)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Balls/No Ball</Text>
                  <Text style={styles.statValue}>{safeToFixed(stats.bowling.ballsPerNoBall)}</Text>
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
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Contributions/Match</Text>
                  <Text style={styles.statValue}>{safeToFixed(stats.fielding.contributionsPerMatch)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Drops/Match</Text>
                  <Text style={styles.statValue}>{safeToFixed(stats.fielding.dropsPerMatch)}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
      <Portal>
        <Dialog
          visible={showMatchDetails.type !== null}
          onDismiss={() => setShowMatchDetails({ type: null, matchIds: [] })}
          style={styles.dialog}
        >
          <Dialog.Title>
            {showMatchDetails.type === 'highest' && 'Highest Score Match'}
            {showMatchDetails.type === 'fifty' && '50+ Score Matches'}
            {showMatchDetails.type === 'hundred' && '100+ Score Matches'}
            {showMatchDetails.type === 'notOut' && 'Not Out Matches'}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={styles.dialogScrollView}>
              {showMatchDetails.matchIds.map(matchId => {
                const match = filteredMatches.find(m => m.id === matchId);
                if (!match) return null;
                return (
                  <View key={matchId} style={styles.matchItem}>
                    <Text style={styles.matchDetailsText}>
                      {formatMatchDetails(match)}
                    </Text>
                    <Text style={styles.matchScoreText}>
                      {match.batting.runs} runs
                      {match.batting.not_out && ' (Not Out)'}
                    </Text>
                    <View style={styles.matchDivider} />
                  </View>
                );
              })}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowMatchDetails({ type: null, matchIds: [] })}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
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
  filterCard: {
    marginBottom: 16,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  filterButton: {
    flex: 1,
    minWidth: '45%',
    marginBottom: 8,
  },
  hyperlink: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  dialog: {
    backgroundColor: 'white',
    maxHeight: '80%',
  },
  dialogScrollView: {
    paddingHorizontal: 16,
  },
  matchItem: {
    paddingVertical: 12,
  },
  matchDetailsText: {
    fontSize: 16,
    marginBottom: 4,
  },
  matchScoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  matchDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 12,
  },
});

export default Stats; 