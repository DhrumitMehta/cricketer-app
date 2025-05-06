-- Create matches table
CREATE TABLE matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    opponent TEXT NOT NULL,
    venue TEXT NOT NULL,
    competition TEXT,
    result TEXT,
    batting JSONB NOT NULL DEFAULT '{
        "position": 0,
        "runs": 0,
        "balls": 0,
        "fours": 0,
        "sixes": 0,
        "dots": 0,
        "not_out": false
    }',
    bowling JSONB NOT NULL DEFAULT '{
        "position": 0,
        "balls": 0,
        "runs": 0,
        "maidens": 0,
        "wickets": 0,
        "dots": 0,
        "fours": 0,
        "sixes": 0
    }',
    fielding JSONB NOT NULL DEFAULT '{
        "catches": 0,
        "run_outs": 0,
        "player_of_match": false
    }',
    source TEXT NOT NULL CHECK (source IN ('manual', 'cricclubs')),
    batting_notes TEXT,
    bowling_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS policies
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matches"
    ON matches FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own matches"
    ON matches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own matches"
    ON matches FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own matches"
    ON matches FOR DELETE
    USING (auth.uid() = user_id);

-- Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 