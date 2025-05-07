-- Create an enum type for match formats
CREATE TYPE match_format_type AS ENUM ('T20', 'ODI', 'T10', 'Other');

-- Add match format column with enum type
ALTER TABLE matches
ADD COLUMN match_format match_format_type NOT NULL DEFAULT 'T20'::match_format_type;

-- Add comment to explain the match format column
COMMENT ON COLUMN matches.match_format IS 'The format of the match (T20, ODI, T10, Other)';

-- Update the column to use the enum type
ALTER TABLE matches
ALTER COLUMN match_format TYPE match_format_type USING match_format::match_format_type; 