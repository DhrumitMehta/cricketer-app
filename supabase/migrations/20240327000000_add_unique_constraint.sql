-- Add unique constraint to prevent duplicate matches
ALTER TABLE matches
ADD CONSTRAINT matches_user_id_date_opponent_key UNIQUE (user_id, date, opponent);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT matches_user_id_date_opponent_key ON matches IS 'Prevents duplicate matches for the same user on the same date against the same opponent'; 