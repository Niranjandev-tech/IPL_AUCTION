-- IPL Auction Room Stored Procedures / RPC Functions (Migration 0002)

-- Helper function to get bid increment slab based on current bid
CREATE OR REPLACE FUNCTION get_bid_increment(current_bid BIGINT)
RETURNS INT AS $$
BEGIN
    IF current_bid < 100 THEN
        RETURN 5;  -- Below ₹1 Cr: ₹5 Lakh
    ELSIF current_bid < 200 THEN
        RETURN 10; -- ₹1 Cr to ₹2 Cr: ₹10 Lakh
    ELSIF current_bid < 300 THEN
        RETURN 20; -- ₹2 Cr to ₹3 Cr: ₹20 Lakh
    ELSE
        RETURN 20; -- Above ₹3 Cr: ₹20 Lakh
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 1. Atomic place_bid function
CREATE OR REPLACE FUNCTION place_bid(
    p_room_id UUID,
    p_team_id UUID,
    p_amount_lakh BIGINT
)
RETURNS JSONB AS $$
DECLARE
    v_room RECORD;
    v_team RECORD;
    v_player RECORD;
    v_settings RECORD;
    v_current_squad_count INT;
    v_current_overseas_count INT;
    v_min_increment INT;
    v_expected_bid BIGINT;
    v_slots_needed INT;
    v_min_purse_needed BIGINT;
    v_now TIMESTAMPTZ := NOW();
    v_new_lot_ends_at TIMESTAMPTZ;
BEGIN
    -- 1. Lock room row FOR UPDATE
    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room not found';
    END IF;

    IF v_room.status != 'live' THEN
        RAISE EXCEPTION 'Auction is not currently live';
    END IF;

    IF v_room.current_player_id IS NULL THEN
        RAISE EXCEPTION 'No player currently on the auction block';
    END IF;

    -- Lock player row FOR UPDATE
    SELECT * INTO v_player FROM public.players WHERE id = v_room.current_player_id FOR UPDATE;
    IF NOT FOUND OR v_player.status != 'nominated' THEN
        RAISE EXCEPTION 'Current player is not active';
    END IF;

    -- Lock team row FOR UPDATE
    SELECT * INTO v_team FROM public.room_teams WHERE id = p_team_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Team not found';
    END IF;

    IF NOT v_team.is_approved THEN
        RAISE EXCEPTION 'Team is not approved by host';
    END IF;

    IF v_team.is_spectator THEN
        RAISE EXCEPTION 'Spectators cannot bid';
    END IF;

    IF v_room.current_bidder_id = p_team_id THEN
        RAISE EXCEPTION 'Your team is already the highest bidder';
    END IF;

    -- Fetch room settings
    SELECT * INTO v_settings FROM public.room_settings WHERE room_id = p_room_id;

    -- Calculate expected minimum bid
    IF v_room.current_bid_amount = 0 THEN
        v_expected_bid := v_player.base_price_lakh;
    ELSE
        v_min_increment := get_bid_increment(v_room.current_bid_amount);
        v_expected_bid := v_room.current_bid_amount + v_min_increment;
    END IF;

    IF p_amount_lakh < v_expected_bid THEN
        RAISE EXCEPTION 'Bid amount % is less than required bid %', p_amount_lakh, v_expected_bid;
    END IF;

    -- Check squad limit
    SELECT COUNT(*) INTO v_current_squad_count FROM public.players WHERE sold_to_team_id = p_team_id;
    IF v_current_squad_count + 1 > COALESCE(v_settings.max_squad, 25) THEN
        RAISE EXCEPTION 'Squad size limit of % players reached', v_settings.max_squad;
    END IF;

    -- Check overseas limit
    IF v_player.is_overseas THEN
        SELECT COUNT(*) INTO v_current_overseas_count FROM public.players WHERE sold_to_team_id = p_team_id AND is_overseas = TRUE;
        IF v_current_overseas_count + 1 > COALESCE(v_settings.max_overseas, 8) THEN
            RAISE EXCEPTION 'Overseas limit of % players reached', v_settings.max_overseas;
        END IF;
    END IF;

    -- Check available purse
    IF v_team.remaining_purse_lakhs < p_amount_lakh THEN
        RAISE EXCEPTION 'Insufficient purse. Remaining: % Lakhs, Bid: % Lakhs', v_team.remaining_purse_lakhs, p_amount_lakh;
    END IF;

    -- PURSE SAFETY CHECK: Ensure team can afford remaining minimum squad slots at lowest base price (30L)
    v_slots_needed := GREATEST(0, COALESCE(v_settings.min_squad, 18) - (v_current_squad_count + 1));
    v_min_purse_needed := v_slots_needed * 30; -- 30 Lakhs min base price

    IF (v_team.remaining_purse_lakhs - p_amount_lakh) < v_min_purse_needed THEN
        RAISE EXCEPTION 'Purse Safety Check failed: You must reserve at least % Lakhs to fill your minimum squad requirement (% slots @ ₹30L)', v_min_purse_needed, v_slots_needed;
    END IF;

    -- Anti-snipe timer extension
    v_new_lot_ends_at := v_room.lot_ends_at;
    IF COALESCE(v_settings.anti_snipe_enabled, TRUE) AND v_room.lot_ends_at IS NOT NULL THEN
        IF (v_room.lot_ends_at - v_now) < INTERVAL '5 seconds' THEN
            v_new_lot_ends_at := v_now + (COALESCE(v_settings.anti_snipe_extend_sec, 10) || ' seconds')::INTERVAL;
        END IF;
    END IF;

    -- Update Room State
    UPDATE public.rooms
    SET current_bidder_id = p_team_id,
        current_bid_amount = p_amount_lakh,
        lot_ends_at = v_new_lot_ends_at,
        updated_at = v_now
    WHERE id = p_room_id;

    -- Insert into Bids history
    INSERT INTO public.bids (room_id, player_id, team_id, amount_lakh, created_at)
    VALUES (p_room_id, v_room.current_player_id, p_team_id, p_amount_lakh, v_now);

    RETURN jsonb_build_object(
        'success', true,
        'amount_lakh', p_amount_lakh,
        'team_id', p_team_id,
        'team_name', v_team.franchise_name,
        'lot_ends_at', v_new_lot_ends_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. sold_player function
CREATE OR REPLACE FUNCTION sold_player(
    p_room_id UUID,
    p_player_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_room RECORD;
    v_player RECORD;
    v_team RECORD;
    v_next_player RECORD;
BEGIN
    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id FOR UPDATE;
    SELECT * INTO v_player FROM public.players WHERE id = p_player_id FOR UPDATE;

    IF v_room.current_bidder_id IS NULL THEN
        RAISE EXCEPTION 'Cannot sell player with no bids. Use unsold_player instead.';
    END IF;

    SELECT * INTO v_team FROM public.room_teams WHERE id = v_room.current_bidder_id FOR UPDATE;

    -- Deduct purse from winning team
    UPDATE public.room_teams
    SET remaining_purse_lakhs = remaining_purse_lakhs - v_room.current_bid_amount
    WHERE id = v_team.id;

    -- Mark player as sold
    UPDATE public.players
    SET status = 'sold',
        sold_to_team_id = v_team.id,
        sold_price_lakh = v_room.current_bid_amount
    WHERE id = p_player_id;

    -- Insert System Chat Message
    INSERT INTO public.chat_messages (room_id, sender_name, message, is_system_msg)
    VALUES (p_room_id, 'AUCTIONEER', 
        '🔨 SOLD! ' || v_player.name || ' sold to ' || v_team.franchise_name || ' for ₹' || (v_room.current_bid_amount::numeric / 100)::text || ' Cr!', 
        TRUE);

    -- Find next pending player
    SELECT * INTO v_next_player FROM public.players 
    WHERE room_id = p_room_id AND status = 'pending' 
    ORDER BY set_order ASC, name ASC LIMIT 1;

    IF FOUND THEN
        UPDATE public.players SET status = 'nominated' WHERE id = v_next_player.id;

        UPDATE public.rooms
        SET current_player_id = v_next_player.id,
            current_bidder_id = NULL,
            current_bid_amount = 0,
            lot_ends_at = NOW() + INTERVAL '30 seconds',
            updated_at = NOW()
        WHERE id = p_room_id;
    ELSE
        -- No more players, complete auction
        UPDATE public.rooms
        SET status = 'completed',
            current_player_id = NULL,
            current_bidder_id = NULL,
            current_bid_amount = 0,
            updated_at = NOW()
        WHERE id = p_room_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'status', 'sold', 'team', v_team.franchise_name, 'price', v_room.current_bid_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. unsold_player function
CREATE OR REPLACE FUNCTION unsold_player(
    p_room_id UUID,
    p_player_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_player RECORD;
    v_next_player RECORD;
BEGIN
    SELECT * INTO v_player FROM public.players WHERE id = p_player_id FOR UPDATE;

    -- Mark player as unsold
    UPDATE public.players
    SET status = 'unsold'
    WHERE id = p_player_id;

    -- System Chat Message
    INSERT INTO public.chat_messages (room_id, sender_name, message, is_system_msg)
    VALUES (p_room_id, 'AUCTIONEER', '❌ UNSOLD! ' || v_player.name || ' goes unsold.', TRUE);

    -- Find next pending player
    SELECT * INTO v_next_player FROM public.players 
    WHERE room_id = p_room_id AND status = 'pending' 
    ORDER BY set_order ASC, name ASC LIMIT 1;

    IF FOUND THEN
        UPDATE public.players SET status = 'nominated' WHERE id = v_next_player.id;

        UPDATE public.rooms
        SET current_player_id = v_next_player.id,
            current_bidder_id = NULL,
            current_bid_amount = 0,
            lot_ends_at = NOW() + INTERVAL '30 seconds',
            updated_at = NOW()
        WHERE id = p_room_id;
    ELSE
        UPDATE public.rooms
        SET status = 'completed',
            current_player_id = NULL,
            current_bidder_id = NULL,
            current_bid_amount = 0,
            updated_at = NOW()
        WHERE id = p_room_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'status', 'unsold');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. undo_last_bid function
CREATE OR REPLACE FUNCTION undo_last_bid(
    p_room_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_last_bid RECORD;
    v_prev_bid RECORD;
BEGIN
    -- Get last bid
    SELECT * INTO v_last_bid FROM public.bids WHERE room_id = p_room_id ORDER BY created_at DESC LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No bids to undo';
    END IF;

    -- Delete last bid
    DELETE FROM public.bids WHERE id = v_last_bid.id;

    -- Find previous bid
    SELECT * INTO v_prev_bid FROM public.bids WHERE room_id = p_room_id ORDER BY created_at DESC LIMIT 1;

    IF FOUND THEN
        UPDATE public.rooms
        SET current_bidder_id = v_prev_bid.team_id,
            current_bid_amount = v_prev_bid.amount_lakh,
            updated_at = NOW()
        WHERE id = p_room_id;
    ELSE
        UPDATE public.rooms
        SET current_bidder_id = NULL,
            current_bid_amount = 0,
            updated_at = NOW()
        WHERE id = p_room_id;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
