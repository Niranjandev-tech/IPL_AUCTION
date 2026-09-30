-- IPL Auction Room Database Schema (Migration 0001)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (synced with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'retention', 'live', 'paused', 'completed')),
    current_player_id UUID,
    current_bidder_id UUID,
    current_bid_amount BIGINT DEFAULT 0, -- in Lakhs
    lot_ends_at TIMESTAMPTZ,
    mode TEXT NOT NULL DEFAULT 'auto' CHECK (mode IN ('manual', 'auto')),
    rtm_state JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room Settings table
CREATE TABLE IF NOT EXISTS public.room_settings (
    room_id UUID PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
    total_purse_lakhs BIGINT DEFAULT 12000, -- ₹120 Crore (12000 Lakhs)
    min_squad INT DEFAULT 18,
    max_squad INT DEFAULT 25,
    max_overseas INT DEFAULT 8,
    max_retentions INT DEFAULT 6,
    timer_duration_sec INT DEFAULT 30,
    anti_snipe_enabled BOOLEAN DEFAULT TRUE,
    anti_snipe_extend_sec INT DEFAULT 10,
    bid_increments JSONB DEFAULT '[
        {"min_lakhs": 0, "max_lakhs": 100, "increment_lakhs": 5},
        {"min_lakhs": 100, "max_lakhs": 200, "increment_lakhs": 10},
        {"min_lakhs": 200, "max_lakhs": 300, "increment_lakhs": 20},
        {"min_lakhs": 300, "max_lakhs": 999999, "increment_lakhs": 20}
    ]'::jsonb,
    accelerated_enabled BOOLEAN DEFAULT TRUE,
    rtm_enabled BOOLEAN DEFAULT TRUE,
    chat_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room Teams (Franchises in a room)
CREATE TABLE IF NOT EXISTS public.room_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    franchise_code TEXT NOT NULL, -- e.g. 'CSK', 'MI', 'RCB', 'KKR', 'SRH', 'DC', 'RR', 'PBKS', 'LSG', 'GT'
    franchise_name TEXT NOT NULL,
    primary_color TEXT NOT NULL,
    secondary_color TEXT NOT NULL,
    logo_url TEXT,
    remaining_purse_lakhs BIGINT NOT NULL,
    rtm_cards_remaining INT DEFAULT 6,
    is_approved BOOLEAN DEFAULT FALSE,
    is_spectator BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_room_user UNIQUE(room_id, user_id),
    CONSTRAINT unique_room_franchise UNIQUE(room_id, franchise_code)
);

-- Players Table
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    is_overseas BOOLEAN NOT NULL DEFAULT FALSE,
    role TEXT NOT NULL CHECK (role IN ('Batter', 'Bowler', 'All-rounder', 'Wicketkeeper')),
    sub_role TEXT, -- e.g. 'Spinner', 'Pacer', 'Off-spinner'
    cap_status TEXT NOT NULL CHECK (cap_status IN ('Capped', 'Uncapped')),
    age INT NOT NULL,
    batting_style TEXT,
    bowling_style TEXT,
    base_price_lakh INT NOT NULL DEFAULT 30, -- in Lakhs (30, 50, 75, 100, 150, 200)
    set_name TEXT NOT NULL,
    set_order INT DEFAULT 1,
    previous_team TEXT,
    stats JSONB DEFAULT '{}'::jsonb,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'nominated', 'sold', 'unsold')),
    sold_to_team_id UUID REFERENCES public.room_teams(id) ON DELETE SET NULL,
    sold_price_lakh BIGINT,
    is_retained BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bids History Table
CREATE TABLE IF NOT EXISTS public.bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.room_teams(id) ON DELETE CASCADE,
    amount_lakh BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    sender_team_id UUID REFERENCES public.room_teams(id) ON DELETE SET NULL,
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    is_system_msg BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist Table
CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.room_teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_watchlist_entry UNIQUE(team_id, player_id)
);

-- Indexes for fast lookup & real-time queries
CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(code);
CREATE INDEX IF NOT EXISTS idx_room_teams_room_id ON public.room_teams(room_id);
CREATE INDEX IF NOT EXISTS idx_players_room_id ON public.players(room_id);
CREATE INDEX IF NOT EXISTS idx_players_status ON public.players(room_id, status);
CREATE INDEX IF NOT EXISTS idx_bids_player_id ON public.bids(player_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_id ON public.chat_messages(room_id);

-- Add foreign key constraint for rooms.current_player_id and rooms.current_bidder_id
ALTER TABLE public.rooms 
    ADD CONSTRAINT fk_rooms_current_player FOREIGN KEY (current_player_id) REFERENCES public.players(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_rooms_current_bidder FOREIGN KEY (current_bidder_id) REFERENCES public.room_teams(id) ON DELETE SET NULL;
