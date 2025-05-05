-- Update fielding statistics structure
ALTER TABLE matches
DROP COLUMN IF EXISTS fielding;

ALTER TABLE matches
ADD COLUMN fielding jsonb DEFAULT jsonb_build_object(
    'infield_catches', 0,
    'boundary_catches', 0,
    'direct_runouts', 0,
    'indirect_runouts', 0,
    'player_of_match', false
);

-- Add comment to explain the fielding column
COMMENT ON COLUMN matches.fielding IS 'Fielding statistics including:
- infield_catches: Number of catches taken in the infield
- boundary_catches: Number of catches taken on the boundary
- direct_runouts: Number of direct run-outs effected
- indirect_runouts: Number of indirect run-outs effected
- player_of_match: Whether the player was awarded player of the match'; 