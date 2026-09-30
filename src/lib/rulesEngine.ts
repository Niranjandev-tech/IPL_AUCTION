import type { BidIncrementSlab, RoomSettings } from '../types/auction.types';

export const DEFAULT_BID_INCREMENTS: BidIncrementSlab[] = [
  { min_lakhs: 0, max_lakhs: 100, increment_lakhs: 5 },
  { min_lakhs: 100, max_lakhs: 200, increment_lakhs: 10 },
  { min_lakhs: 200, max_lakhs: 300, increment_lakhs: 20 },
  { min_lakhs: 300, max_lakhs: 999999, increment_lakhs: 20 },
];

export const DEFAULT_ROOM_SETTINGS: Omit<RoomSettings, 'room_id'> = {
  total_purse_lakhs: 12000, // ₹120 Cr
  min_squad: 18,
  max_squad: 25,
  max_overseas: 8,
  max_retentions: 6,
  timer_duration_sec: 30,
  anti_snipe_enabled: true,
  anti_snipe_extend_sec: 10,
  bid_increments: DEFAULT_BID_INCREMENTS,
  accelerated_enabled: true,
  rtm_enabled: true,
  chat_enabled: true,
};

/**
 * Calculates bid increment in Lakhs based on current bid
 */
export function getBidIncrement(currentBidLakhs: number, slabs = DEFAULT_BID_INCREMENTS): number {
  const slab = slabs.find(
    (s) => currentBidLakhs >= s.min_lakhs && currentBidLakhs < s.max_lakhs
  );
  return slab ? slab.increment_lakhs : 20;
}

/**
 * Formats Lakhs into human-readable INR currency format (Crores or Lakhs)
 * e.g., 12000 -> "₹120.00 Cr", 75 -> "₹75 Lakh", 150 -> "₹1.50 Cr"
 */
export function formatLakhs(lakhs: number): string {
  if (lakhs <= 0) return '₹0';
  if (lakhs >= 100) {
    const cr = lakhs / 100;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  return `₹${lakhs} Lakh`;
}

/**
 * Short price tag helper: e.g. "120 Cr" or "75 L"
 */
export function formatShortPrice(lakhs: number): string {
  if (lakhs >= 100) {
    const cr = lakhs / 100;
    return `${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  return `${lakhs} L`;
}

export interface PurseSafetyResult {
  safe: boolean;
  minReservedRequiredLakh?: number;
  slotsNeeded?: number;
  message?: string;
}

/**
 * Purse Safety Check
 * Verifies if team has enough remaining purse to bid `bidAmountLakh` and still afford
 * minimum squad slots required at minimum base price (30 Lakhs).
 */
export function checkPurseSafety(
  currentPurseLakh: number,
  bidAmountLakh: number,
  currentSquadCount: number,
  minSquad: number = 18,
  minBasePriceLakh: number = 30
): PurseSafetyResult {
  const squadAfterBid = currentSquadCount + 1;
  const slotsNeeded = Math.max(0, minSquad - squadAfterBid);
  const minReservedRequiredLakh = slotsNeeded * minBasePriceLakh;
  const purseRemainingAfterBid = currentPurseLakh - bidAmountLakh;

  if (purseRemainingAfterBid < 0) {
    return {
      safe: false,
      minReservedRequiredLakh,
      slotsNeeded,
      message: `Insufficient purse. Remaining: ${formatLakhs(currentPurseLakh)}`,
    };
  }

  if (purseRemainingAfterBid < minReservedRequiredLakh) {
    return {
      safe: false,
      minReservedRequiredLakh,
      slotsNeeded,
      message: `Purse Safety Check: You must reserve at least ${formatLakhs(minReservedRequiredLakh)} to fill ${slotsNeeded} remaining minimum squad slots (@ ₹30 Lakhs each).`,
    };
  }

  return { safe: true, minReservedRequiredLakh, slotsNeeded };
}
