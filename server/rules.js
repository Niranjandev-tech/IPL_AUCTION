/**
 * IPL Auction Rules Engine (Server Side)
 */

export const DEFAULT_BID_INCREMENTS = [
  { min_lakhs: 0, max_lakhs: 100, increment_lakhs: 5 },
  { min_lakhs: 100, max_lakhs: 200, increment_lakhs: 10 },
  { min_lakhs: 200, max_lakhs: 300, increment_lakhs: 20 },
  { min_lakhs: 300, max_lakhs: 999999, increment_lakhs: 20 },
];

export function getBidIncrement(currentBidLakhs, slabs = DEFAULT_BID_INCREMENTS) {
  const slab = slabs.find(
    (s) => currentBidLakhs >= s.min_lakhs && currentBidLakhs < s.max_lakhs
  );
  return slab ? slab.increment_lakhs : 20;
}

export function checkPurseSafety(
  currentPurseLakh,
  bidAmountLakh,
  currentSquadCount,
  minSquad = 18,
  minBasePriceLakh = 30
) {
  const squadAfterBid = currentSquadCount + 1;
  const slotsNeeded = Math.max(0, minSquad - squadAfterBid);
  const minReservedRequiredLakh = slotsNeeded * minBasePriceLakh;
  const purseRemainingAfterBid = currentPurseLakh - bidAmountLakh;

  if (purseRemainingAfterBid < 0) {
    return {
      safe: false,
      minReservedRequiredLakh,
      slotsNeeded,
      message: `Insufficient purse. Remaining purse: ₹${(currentPurseLakh / 100).toFixed(2)} Cr`,
    };
  }

  if (purseRemainingAfterBid < minReservedRequiredLakh) {
    return {
      safe: false,
      minReservedRequiredLakh,
      slotsNeeded,
      message: `Purse Safety Check: Must reserve at least ₹${(minReservedRequiredLakh / 100).toFixed(2)} Cr for ${slotsNeeded} remaining squad slots (@ ₹30L each).`,
    };
  }

  return { safe: true, minReservedRequiredLakh, slotsNeeded };
}
