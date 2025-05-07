-- Update fielding statistics to include drops
ALTER TABLE matches
ALTER COLUMN fielding SET DEFAULT jsonb_build_object(
    'infield_catches', 0,
    'boundary_catches', 0,
    'direct_runouts', 0,
    'indirect_runouts', 0,
    'drops', 0,
    'player_of_match', false
);

-- Update existing records to include drops
UPDATE matches
SET fielding = fielding || jsonb_build_object('drops', 0)
WHERE NOT fielding ? 'drops'; 