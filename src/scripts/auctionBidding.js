// Pure auction clock; inject time/randomness for deterministic verification.
export const AUCTION_DURATION = 15000;
// Preserve the original number of bids while compressing a two-minute sale to 15s.
const BID_TIME_SCALE = AUCTION_DURATION / 120000;
export function createAuctionBidding({ base = 0, random = Math.random } = {}) {
  let started = null, nextBid = 0, highest = Math.max(0, Math.round(base)), winner = null, sold = false;
  const history = [];
  function start(now) { if (started === null) { started = now; nextBid = now + 2200 * BID_TIME_SCALE; } }
  function update(now) {
    if (started === null) return { highest, winner, sold, remaining: AUCTION_DURATION / 1000, bids: [] };
    const bids = [], deadline = started + AUCTION_DURATION;
    while (!sold && nextBid < deadline && nextBid <= now) {
      const increment = 50 + Math.floor(Math.min(.999999, random()) * 751);
      let bidder = Math.floor(Math.min(.999999, random()) * 108);
      if (bidder === winner) bidder = (bidder + 1) % 108;
      highest += increment; winner = bidder;
      const bid = { bidder, value: highest, increment, time: nextBid };
      history.push(bid); bids.push(bid);
      nextBid += (1800 + Math.floor(random() * 1700)) * BID_TIME_SCALE;
    }
    if (now >= deadline) sold = true;
    return { highest, winner, sold, remaining: Math.max(0, Math.ceil((deadline - now) / 1000)), bids };
  }
  return { start, update, history };
}
