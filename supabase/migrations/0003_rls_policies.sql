-- IPL Auction Room RLS Policies & Realtime Setup (Migration 0003)

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Rooms
CREATE POLICY "Rooms viewable by everyone" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rooms" ON public.rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update room" ON public.rooms FOR UPDATE USING (auth.uid() = host_id);

-- 3. Room Settings
CREATE POLICY "Room settings viewable by everyone" ON public.room_settings FOR SELECT USING (true);
CREATE POLICY "Host can manage settings" ON public.room_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND host_id = auth.uid())
);

-- 4. Room Teams
CREATE POLICY "Room teams viewable by everyone" ON public.room_teams FOR SELECT USING (true);
CREATE POLICY "Users can join rooms as team" ON public.room_teams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team owner or host can update team" ON public.room_teams FOR UPDATE USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND host_id = auth.uid())
);

-- 5. Players
CREATE POLICY "Players viewable by everyone" ON public.players FOR SELECT USING (true);
CREATE POLICY "Host can insert/update/delete players" ON public.players FOR ALL USING (
    EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND host_id = auth.uid())
);

-- 6. Bids
CREATE POLICY "Bids viewable by everyone" ON public.bids FOR SELECT USING (true);
CREATE POLICY "Team members can insert bids" ON public.bids FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.room_teams WHERE id = team_id AND user_id = auth.uid() AND is_approved = true)
);

-- 7. Chat Messages
CREATE POLICY "Chat messages viewable by room members" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can send chat messages" ON public.chat_messages FOR INSERT WITH CHECK (true);

-- 8. Watchlists
CREATE POLICY "Watchlists viewable by team owner" ON public.watchlists FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.room_teams WHERE id = team_id AND user_id = auth.uid())
);
CREATE POLICY "Team owner can modify watchlist" ON public.watchlists FOR ALL USING (
    EXISTS (SELECT 1 FROM public.room_teams WHERE id = team_id AND user_id = auth.uid())
);

-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Automatically create profile on auth signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
