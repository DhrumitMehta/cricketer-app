const XLSX = require('xlsx');
const fetch = require('node-fetch');
require('dotenv').config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing required environment variables.');
  console.error('Please create a .env file in the scripts directory with:');
  console.error('SUPABASE_URL=your_supabase_url');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Clean up the URL to remove any trailing semicolons or slashes
const supabaseUrl = process.env.SUPABASE_URL.replace(/[;/]$/, '');

const USER_ID = '45a51356-bca2-4301-8d36-30a92d269889';

// Helper function to map match format to valid enum value
function getMatchFormat(format) {
  if (!format) return 'T20';
  
  const formatStr = format.toString().toLowerCase();
  if (formatStr === '50' || formatStr === '50 over' || formatStr === 'odi') return 'ODI';
  if (formatStr === '20' || formatStr === 't20') return 'T20';
  if (formatStr === '10' || formatStr === 't10') return 'T10';
  return 'Other';
}

// Helper function to get value checking multiple possible column names
function getValue(row, possibleNames, defaultValue = null) {
  for (const name of possibleNames) {
    if (row[name] !== undefined) return row[name];
  }
  return defaultValue;
}

// Helper function to insert with retries
async function insertWithRetry(matchData, retries = 3) {
  const url = `${supabaseUrl}/rest/v1/matches`;
  
  for (let i = 0; i < retries; i++) {
    try {
      // First check if the match already exists
      const checkResponse = await fetch(
        `${supabaseUrl}/rest/v1/matches?user_id=eq.${matchData.user_id}&date=eq.${matchData.date.toISOString().split('T')[0]}&opponent=eq.${encodeURIComponent(matchData.opponent)}`, 
        {
          method: 'GET',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );

      if (!checkResponse.ok) {
        throw new Error(`Failed to check for existing match: ${await checkResponse.text()}`);
      }

      const existingMatches = await checkResponse.json();
      
      let response;
      if (existingMatches.length > 0) {
        // Update existing match
        console.log('Updating existing match:', matchData.date);
        response = await fetch(
          `${supabaseUrl}/rest/v1/matches?id=eq.${existingMatches[0].id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(matchData)
          }
        );
      } else {
        // Insert new match
        console.log('Inserting new match:', matchData.date);
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(matchData)
        });
      }

      if (response.ok) {
        console.log('Successfully processed match:', matchData.date);
        return;
      }

      const error = await response.text();
      console.error(`Attempt ${i + 1} failed with status ${response.status}:`, error);
      console.error('Request URL:', url);
      console.error('Request headers:', {
        'apikey': '***',
        'Authorization': 'Bearer ***',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      });
      console.error('Request body:', JSON.stringify(matchData, null, 2));
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    } catch (error) {
      console.error(`Attempt ${i + 1} failed with error:`, error);
      if (i === retries - 1) throw error;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

async function importMatches(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    
    // Process batting data
    const battingSheet = workbook.Sheets['Batting Input'];
    const battingData = XLSX.utils.sheet_to_json(battingSheet);

    // Process bowling data - use same approach as batting
    const bowlingSheet = workbook.Sheets['Bowling Input'];
    const bowlingData = XLSX.utils.sheet_to_json(bowlingSheet);

    // Debug the bowling data
    console.log('First few bowling rows:', bowlingData.slice(0, 3));

    // Map column names
    const battingColumnMap = {
      date: ['2024 MATCHES BATTING', '__EMPTY'],
      match_format: ['__EMPTY'],
      venue: ['__EMPTY_1'],
      team_for: ['__EMPTY_2'],
      opponent: ['__EMPTY_3'],
      position: ['__EMPTY_4'],
      runs: ['__EMPTY_5'],
      balls: ['__EMPTY_6'],
      singles: ['__EMPTY_7'],
      doubles: ['__EMPTY_8'],
      triples: ['__EMPTY_9'],
      fours: ['__EMPTY_10'],
      sixes: ['__EMPTY_11'],
      dots: ['__EMPTY_12'],
      not_out: ['__EMPTY_13'],
      how_out: ['__EMPTY_14'],
      shot_out: ['__EMPTY_15'],
      error_type: ['__EMPTY_16'],
      bowler_type: ['__EMPTY_17'],
      batting_notes: ['__EMPTY_18']
    };

    const bowlingColumnMap = {
      date: ['2024 MATCHES BOWLING', '__EMPTY'],
      match_format: ['__EMPTY'],
      venue: ['__EMPTY_1'],
      team_for: ['__EMPTY_2'],
      opponent: ['__EMPTY_3'],
      position: ['__EMPTY_4'],
      balls: ['__EMPTY_5'],
      runs: ['__EMPTY_6'],
      maidens: ['__EMPTY_7'],
      wickets: ['__EMPTY_8'],
      dots: ['__EMPTY_9'],
      wides: ['__EMPTY_10'],
      noballs: ['__EMPTY_11'],
      fours: ['__EMPTY_12'],
      sixes: ['__EMPTY_13'],
      catches: ['__EMPTY_14'],
      runouts: ['__EMPTY_15'],
      bowling_notes: ['__EMPTY_16']
    };

    let successCount = 0;
    let errorCount = 0;

    for (const row of battingData) {
      // Skip header row
      if (getValue(row, battingColumnMap.date) === 'date') continue;

      const date = getValue(row, battingColumnMap.date);
      const opponent = getValue(row, battingColumnMap.opponent);

      if (!date || !opponent) {
        console.log('Skipping row due to missing date or opponent:', row);
        continue;
      }

      const matchData = {
        user_id: USER_ID,
        date: new Date((date - (25567 + 2)) * 86400 * 1000), // Convert Excel date to JS date
        match_format: getMatchFormat(getValue(row, battingColumnMap.match_format)),
        venue: getValue(row, battingColumnMap.venue),
        opponent: opponent,
        source: 'manual',
        batting: {
          position: getValue(row, battingColumnMap.position, 0),
          runs: getValue(row, battingColumnMap.runs, 0),
          balls: getValue(row, battingColumnMap.balls, 0),
          singles: getValue(row, battingColumnMap.singles, 0),
          doubles: getValue(row, battingColumnMap.doubles, 0),
          triples: getValue(row, battingColumnMap.triples, 0),
          fours: getValue(row, battingColumnMap.fours, 0),
          sixes: getValue(row, battingColumnMap.sixes, 0),
          dots: getValue(row, battingColumnMap.dots, 0),
          not_out: getValue(row, battingColumnMap.not_out, '').toString().toLowerCase().includes('true'),
          how_out: getValue(row, battingColumnMap.how_out),
          shot_out: getValue(row, battingColumnMap.shot_out),
          error_type: getValue(row, battingColumnMap.error_type),
          bowler_type: getValue(row, battingColumnMap.bowler_type)
        },
        bowling: {
          position: 0,
          balls: 0,
          runs: 0,
          maidens: 0,
          wickets: 0,
          dots: 0,
          fours: 0,
          sixes: 0
        },
        fielding: {
          infield_catches: 0,
          boundary_catches: 0,
          direct_runouts: 0,
          indirect_runouts: 0,
          drops: 0,
          player_of_match: false
        },
        batting_notes: getValue(row, battingColumnMap.batting_notes),
        bowling_notes: '',
        bowling_wides: 0,
        bowling_noballs: 0
      };

      // Find corresponding bowling data
      const bowlingRow = bowlingData.find(bRow => {
        const bowlingDate = getValue(bRow, bowlingColumnMap.date);
        const bowlingOpponent = getValue(bRow, bowlingColumnMap.opponent);
        
        // Debug the date matching
        console.log('Comparing dates:', {
          battingDate: date,
          bowlingDate: bowlingDate,
          battingOpponent: opponent,
          bowlingOpponent: bowlingOpponent
        });
        
        return bowlingDate === date && bowlingOpponent === opponent;
      });

      if (bowlingRow) {
        console.log('Found matching bowling row:', bowlingRow);
        
        matchData.bowling = {
          position: getValue(bowlingRow, bowlingColumnMap.position, 0),
          balls: getValue(bowlingRow, bowlingColumnMap.balls, 0),
          runs: getValue(bowlingRow, bowlingColumnMap.runs, 0),
          maidens: getValue(bowlingRow, bowlingColumnMap.maidens, 0),
          wickets: getValue(bowlingRow, bowlingColumnMap.wickets, 0),
          dots: getValue(bowlingRow, bowlingColumnMap.dots, 0),
          fours: getValue(bowlingRow, bowlingColumnMap.fours, 0),
          sixes: getValue(bowlingRow, bowlingColumnMap.sixes, 0)
        };
        matchData.bowling_wides = getValue(bowlingRow, bowlingColumnMap.wides, 0);
        matchData.bowling_noballs = getValue(bowlingRow, bowlingColumnMap.noballs, 0);
        matchData.bowling_notes = getValue(bowlingRow, bowlingColumnMap.bowling_notes, '');
        matchData.fielding = {
          infield_catches: getValue(bowlingRow, bowlingColumnMap.catches, 0),
          boundary_catches: 0,
          direct_runouts: getValue(bowlingRow, bowlingColumnMap.runouts, 0),
          indirect_runouts: 0,
          drops: 0,
          player_of_match: false
        };

        console.log('Processed bowling data:', {
          bowling: matchData.bowling,
          wides: matchData.bowling_wides,
          noballs: matchData.bowling_noballs,
          fielding: matchData.fielding
        });
      } else {
        console.log('No matching bowling row found for:', {
          date: date,
          excelDate: new Date((date - (25567 + 2)) * 86400 * 1000).toISOString().split('T')[0],
          opponent: opponent,
          availableBowlingDates: bowlingData.map(row => ({
            date: getValue(row, bowlingColumnMap.date),
            opponent: getValue(row, bowlingColumnMap.opponent)
          }))
        });
      }

      try {
        await insertWithRetry(matchData);
        successCount++;
      } catch (error) {
        console.error('Failed to insert match after retries:', error);
        errorCount++;
      }
    }

    console.log(`Import completed! Successfully imported ${successCount} matches, failed to import ${errorCount} matches.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Get the Excel file path from command line arguments
const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide the Excel file path as a command line argument');
  process.exit(1);
}

importMatches(filePath);