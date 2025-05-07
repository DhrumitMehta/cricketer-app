-- Update batting statistics to include run types
ALTER TABLE matches
ALTER COLUMN batting SET DEFAULT jsonb_build_object(
    'position', 0,
    'runs', 0,
    'balls', 0,
    'singles', 0,
    'doubles', 0,
    'triples', 0,
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
- singles: Number of singles scored
- doubles: Number of doubles scored
- triples: Number of triples scored
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
    'singles', 0,
    'doubles', 0,
    'triples', 0
)
WHERE NOT (batting ? 'singles' AND batting ? 'doubles' AND batting ? 'triples'); 