-- Add new columns for bowling extras
ALTER TABLE matches
ADD COLUMN bowling_wides int,
ADD COLUMN bowling_noballs int;

-- Add columns for bowling metrics
ALTER TABLE matches
ADD COLUMN bowling_economy numeric(4,1),
ADD COLUMN bowling_dot_percentage numeric(4,1),
ADD COLUMN bowling_balls_per_boundary numeric(4,1);

-- Add comments to explain the columns
COMMENT ON COLUMN matches.bowling_wides IS 'Number of wides bowled';
COMMENT ON COLUMN matches.bowling_noballs IS 'Number of no-balls bowled';
COMMENT ON COLUMN matches.bowling_economy IS 'Bowling economy rate (runs/balls * 6)';
COMMENT ON COLUMN matches.bowling_dot_percentage IS 'Percentage of dot balls bowled (dots/balls * 100)';
COMMENT ON COLUMN matches.bowling_balls_per_boundary IS 'Average number of balls bowled per boundary conceded (balls/(4s + 6s))';

-- Create function to calculate bowling metrics
CREATE OR REPLACE FUNCTION calculate_bowling_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate economy rate
    IF (NEW.bowling->>'balls')::int > 0 THEN
        NEW.bowling_economy := ROUND(((NEW.bowling->>'runs')::int::float / (NEW.bowling->>'balls')::int::float * 6)::numeric, 1);
    ELSE
        NEW.bowling_economy := 0;
    END IF;

    -- Calculate dot percentage
    IF (NEW.bowling->>'balls')::int > 0 THEN
        NEW.bowling_dot_percentage := ROUND(((NEW.bowling->>'dots')::int::float / (NEW.bowling->>'balls')::int::float * 100)::numeric, 1);
    ELSE
        NEW.bowling_dot_percentage := 0;
    END IF;

    -- Calculate balls per boundary
    IF ((NEW.bowling->>'fours')::int + (NEW.bowling->>'sixes')::int) > 0 THEN
        NEW.bowling_balls_per_boundary := ROUND(((NEW.bowling->>'balls')::int::float / ((NEW.bowling->>'fours')::int + (NEW.bowling->>'sixes')::int)::float)::numeric, 1);
    ELSE
        NEW.bowling_balls_per_boundary := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update metrics
CREATE TRIGGER update_bowling_metrics
    BEFORE INSERT OR UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION calculate_bowling_metrics();

-- Create an index on these columns for better query performance
CREATE INDEX idx_matches_bowling_metrics ON matches (bowling_economy, bowling_dot_percentage, bowling_balls_per_boundary);

-- Update existing records
UPDATE matches SET 
    bowling_economy = CASE 
        WHEN (bowling->>'balls')::int > 0 
        THEN ROUND(((bowling->>'runs')::int::float / (bowling->>'balls')::int::float * 6)::numeric, 1)
        ELSE 0 
    END,
    bowling_dot_percentage = CASE 
        WHEN (bowling->>'balls')::int > 0 
        THEN ROUND(((bowling->>'dots')::int::float / (bowling->>'balls')::int::float * 100)::numeric, 1)
        ELSE 0 
    END,
    bowling_balls_per_boundary = CASE 
        WHEN ((bowling->>'fours')::int + (bowling->>'sixes')::int) > 0 
        THEN ROUND(((bowling->>'balls')::int::float / ((bowling->>'fours')::int + (bowling->>'sixes')::int)::float)::numeric, 1)
        ELSE NULL 
    END; 