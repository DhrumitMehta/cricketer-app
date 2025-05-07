-- Update batting statistics to include dismissal details
ALTER TABLE matches
ALTER COLUMN batting SET DEFAULT jsonb_build_object(
    'position', 0,
    'runs', 0,
    'balls', 0,
    'fours', 0,
    'sixes', 0,
    'dots', 0,
    'not_out', false,
    'how_out', null,
    'shot_out', null,
    'error_type', null,
    'bowler_type', null
);

-- Add comments to explain the new fields
COMMENT ON COLUMN matches.batting IS 'Batting statistics including:
- position: Batting position
- runs: Number of runs scored
- balls: Number of balls faced
- fours: Number of fours hit
- sixes: Number of sixes hit
- dots: Number of dot balls
- not_out: Whether the player was not out
- how_out: How the player got out (Bowled, LBW, Stumped, etc.)
- shot_out: The shot played when dismissed
- error_type: Type of error (Mental or Execution)
- bowler_type: Type of bowler (LAO, RAOS, etc.)';

-- Update existing records to include the new fields
UPDATE matches
SET batting = batting || jsonb_build_object(
    'how_out', null,
    'shot_out', null,
    'error_type', null,
    'bowler_type', null
)
WHERE NOT (batting ? 'how_out' AND batting ? 'shot_out' AND batting ? 'error_type' AND batting ? 'bowler_type'); 