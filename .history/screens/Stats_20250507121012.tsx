import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { Text, Card } from 'react-native-paper';
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
    fetchStats();
  }, []);

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
          average: 0,
          strikeRate: 0,
          highest: Math.max(...matches.map(m => m.batting.runs)),
          notOuts: matches.filter(m => m.batting.not_out).length,
          fours: matches.reduce((sum, m) => sum + m.batting.fours, 0),
          sixes: matches.reduce((sum, m) => sum + m.batting.sixes, 0),
          dots: matches.reduce((sum, m) => sum + m.batting.dots, 0),
          dotPercentage: 0,
          boundaryPercentage: 0,
          ballsPerBoundary: 0,
          fifties: matches.filter(m => m.batting.runs >= 50 && m.batting.runs < 100).length,
          hundreds: matches.filter(m => m.batting.runs >= 100).length,
          avgPosition: matches.reduce((sum, m) => sum + (m.batting?.position || 0), 0) / 
                      matches.filter(m => m.batting?.position > 0).length || 0,
        },
        bowling: {
          matches: matches.length,
          innings: matches.filter(m => m.bowling.balls > 0).length,
          balls: matches.reduce((sum, m) => sum + m.bowling.balls, 0),
          overs: Math.floor(matches.reduce((sum, m) => sum + m.bowling.balls, 0) / 6),
          maidens: matches.reduce((sum, m) => sum + m.bowling.maidens, 0),
          runs: matches.reduce((sum, m) => sum + m.bowling.runs, 0),
          wickets: matches.reduce((sum, m) => sum + m.bowling.wickets, 0),
          average: 0,
          economy: 0,
          strikeRate: 0,
          bestFigures: '0/0',
          dots: matches.reduce((sum, m) => sum + m.bowling.dots, 0),
          fours: matches.reduce((sum, m) => sum + m.bowling.fours, 0),
          sixes: matches.reduce((sum, m) => sum + m.bowling.sixes, 0),
          wides: matches.reduce((sum, m) => sum + (m.bowling_wides || 0), 0),
          noBalls: matches.reduce((sum, m) => sum + (m.bowling_noballs || 0), 0),
          dotPercentage: 0,
          ballsPerBoundary: 0,
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
    } finally {
      setLoading(false);
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
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>50s</Text>
                  <Text style={styles.statValue}>{stats.batting.fifties}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>100s</Text>
                  <Text style={styles.statValue}>{stats.batting.hundreds}</Text>
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
});

export default Stats; 