-- SQL schema for the new game-specific table (Battle Card Game)
-- This is designed for a multi-game database structure

CREATE TABLE IF NOT EXISTS public.battle_card_game_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 150,
    progression_data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.battle_card_game_data ENABLE ROW LEVEL SECURITY;

-- Policies for Row Level Security
-- 1. Allow users to select their own game records
CREATE POLICY "Users can view their own game data" 
    ON public.battle_card_game_data 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 2. Allow users to insert their own game records
CREATE POLICY "Users can insert their own game data" 
    ON public.battle_card_game_data 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 3. Allow users to update their own game records
CREATE POLICY "Users can update their own game data" 
    ON public.battle_card_game_data 
    FOR UPDATE 
    USING (auth.uid() = user_id);
