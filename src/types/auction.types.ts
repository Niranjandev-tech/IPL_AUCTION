export type FranchiseCode = 'CSK' | 'MI' | 'RCB' | 'KKR' | 'SRH' | 'DC' | 'RR' | 'PBKS' | 'LSG' | 'GT';

export interface FranchiseInfo {
  code: FranchiseCode;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  city: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

export type RoomStatus = 'lobby' | 'retention' | 'live' | 'paused' | 'completed' | 'rtm';
export type RoomMode = 'manual' | 'auto';

export interface Room {
  id: string;
  code: string;
  name: string;
  host_id: string;
  status: RoomStatus;
  current_player_id?: string | null;
  current_bidder_id?: string | null;
  current_bid_amount: number; // in Lakhs
  lot_ends_at?: string | null;
  mode: RoomMode;
  rtm_state?: RTMState | null;
  created_at: string;
  updated_at: string;
}

export interface BidIncrementSlab {
  min_lakhs: number;
  max_lakhs: number;
  increment_lakhs: number;
}

export interface RoomSettings {
  room_id: string;
  total_purse_lakhs: number; // default 12000 = ₹120 Cr
  min_squad: number; // default 18
  max_squad: number; // default 25
  max_overseas: number; // default 8
  max_retentions: number; // default 6
  timer_duration_sec: number; // default 30
  anti_snipe_enabled: boolean; // default true
  anti_snipe_extend_sec: number; // default 10
  bid_increments: BidIncrementSlab[];
  accelerated_enabled: boolean;
  rtm_enabled: boolean;
  chat_enabled: boolean;
}

export interface RoomTeam {
  id: string;
  room_id: string;
  user_id: string;
  franchise_code: FranchiseCode;
  franchise_name: string;
  primary_color: string;
  secondary_color: string;
  logo_url?: string;
  remaining_purse_lakhs: number;
  rtm_cards_remaining: number;
  is_approved: boolean;
  is_spectator: boolean;
  user_profile?: Profile;
  squad_count?: number;
  overseas_count?: number;
}

export type PlayerRole = 'Batter' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';
export type CapStatus = 'Capped' | 'Uncapped';
export type PlayerStatus = 'pending' | 'nominated' | 'sold' | 'unsold';

export interface PlayerStats {
  matches?: number;
  runs?: number;
  batting_avg?: number;
  strike_rate?: number;
  wickets?: number;
  economy?: number;
  hs?: string; // Highest score
  best_bowling?: string;
}

export interface Player {
  id: string;
  room_id: string;
  name: string;
  country: string;
  is_overseas: boolean;
  role: PlayerRole;
  sub_role?: string | null;
  cap_status: CapStatus;
  age: number;
  batting_style?: string | null;
  bowling_style?: string | null;
  base_price_lakh: number; // in Lakhs: 30, 50, 75, 100, 150, 200
  set_name: string;
  set_order: number;
  previous_team?: string | null;
  stats?: PlayerStats;
  image_url?: string;
  status: PlayerStatus;
  sold_to_team_id?: string | null;
  sold_price_lakh?: number | null;
  is_retained?: boolean;
}

export interface Bid {
  id: string;
  room_id: string;
  player_id: string;
  team_id: string;
  amount_lakh: number;
  created_at: string;
  team?: RoomTeam;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_team_id?: string | null;
  sender_name: string;
  message: string;
  is_system_msg: boolean;
  created_at: string;
  sender_team?: RoomTeam;
}

export interface RTMState {
  original_team_id: string;
  original_team_name: string;
  winning_team_id: string;
  winning_bid_lakh: number;
  player_id: string;
  step: 'offered_to_rtm_team' | 'counter_offered_by_winner' | 'final_decision';
}
