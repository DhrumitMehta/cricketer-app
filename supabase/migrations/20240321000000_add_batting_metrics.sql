-- Add columns for batting metrics
ALTER TABLE matches
ADD COLUMN dot_percentage numeric(4,1),
ADD COLUMN strike_rate numeric(4,1),
ADD COLUMN boundary_percentage numeric(4,1),
ADD COLUMN balls_per_boundary numeric(4,1);

-- Add comments to explain the columns
COMMENT ON COLUMN matches.dot_percentage IS 'Percentage of dot balls faced (dots/balls * 100)';
COMMENT ON COLUMN matches.strike_rate IS 'Batting strike rate (runs/balls * 100)';
COMMENT ON COLUMN matches.boundary_percentage IS 'Percentage of runs scored in boundaries ((4s*4 + 6s*6)/runs * 100)';
COMMENT ON COLUMN matches.balls_per_boundary IS 'Average number of balls faced per boundary hit (balls/(4s + 6s))';

-- Create function to calculate batting metrics
CREATE OR REPLACE FUNCTION calculate_batting_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate dot percentage
    IF (NEW.batting->>'balls')::int > 0 THEN
        NEW.dot_percentage := ROUND(((NEW.batting->>'dots')::int::float / (NEW.batting->>'balls')::int::float * 100)::numeric, 1);
    ELSE
        NEW.dot_percentage := 0;
    END IF;

    -- Calculate strike rate
    IF (NEW.batting->>'balls')::int > 0 THEN
        NEW.strike_rate := ROUND(((NEW.batting->>'runs')::int::float / (NEW.batting->>'balls')::int::float * 100)::numeric, 1);
    ELSE
        NEW.strike_rate := 0;
    END IF;

    -- Calculate boundary percentage
    IF (NEW.batting->>'runs')::int > 0 THEN
        NEW.boundary_percentage := ROUND((((NEW.batting->>'fours')::int * 4 + (NEW.batting->>'sixes')::int * 6)::float / (NEW.batting->>'runs')::int::float * 100)::numeric, 1);
    ELSE
        NEW.boundary_percentage := 0;
    END IF;

    -- Calculate balls per boundary
    IF ((NEW.batting->>'fours')::int + (NEW.batting->>'sixes')::int) > 0 THEN
        NEW.balls_per_boundary := ROUND(((NEW.batting->>'balls')::int::float / ((NEW.batting->>'fours')::int + (NEW.batting->>'sixes')::int)::float)::numeric, 1);
    ELSE
        NEW.balls_per_boundary := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update metrics
CREATE TRIGGER update_batting_metrics
    BEFORE INSERT OR UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION calculate_batting_metrics();

-- Create an index on these columns for better query performance
CREATE INDEX idx_matches_batting_metrics ON matches (dot_percentage, strike_rate, boundary_percentage, balls_per_boundary);

-- Update existing records
UPDATE matches SET 
    dot_percentage = CASE 
        WHEN (batting->>'balls')::int > 0 
        THEN ROUND(((batting->>'dots')::int::float / (batting->>'balls')::int::float * 100)::numeric, 1)
        ELSE 0 
    END,
    strike_rate = CASE 
        WHEN (batting->>'balls')::int > 0 
        THEN ROUND(((batting->>'runs')::int::float / (batting->>'balls')::int::float * 100)::numeric, 1)
        ELSE 0 
    END,
    boundary_percentage = CASE 
        WHEN (batting->>'runs')::int > 0 
        THEN ROUND((((batting->>'fours')::int * 4 + (batting->>'sixes')::int * 6)::float / (batting->>'runs')::int::float * 100)::numeric, 1)
        ELSE 0 
    END,
    balls_per_boundary = CASE 
        WHEN ((batting->>'fours')::int + (batting->>'sixes')::int) > 0 
        THEN ROUND(((batting->>'balls')::int::float / ((batting->>'fours')::int + (batting->>'sixes')::int)::float)::numeric, 1)
        ELSE NULL 
    END; 