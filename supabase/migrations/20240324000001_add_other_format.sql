-- Add other_format column for custom match formats
ALTER TABLE matches
ADD COLUMN other_format text;

-- Add comment to explain the other_format column
COMMENT ON COLUMN matches.other_format IS 'Specifies the format when match_format is set to Other'; 