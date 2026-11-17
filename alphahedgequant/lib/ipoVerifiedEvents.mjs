// Source-checked launch-week references, not an automatically updated market feed.
// Prices, subscription, GMP and listing outcomes always come from the live provider.
// Never interpret a static reference date as the timestamp of an exchange quote.
export const IPO_REFERENCE_AS_OF="2026-11-17";
export const VERIFIED_IPO_REFERENCES={
 "crystalcropprotection-ipo":{
  name:"Crystal Crop Protection",
  sourceLabel:"Crystal Crop Protection · issuer investor relations / RHP",
  sourceUrl:"https://www.crystalcropprotection.com/investor-relations",
  note:"Issuer-hosted November 2026 red-herring prospectus; bidding scheduled 18–20 November. Proposed NSE/BSE listing."
 },
 "mahanadicoalfields-ipo":{
  name:"Mahanadi Coalfields",
  sourceLabel:"Coal India · NSE corporate filing (MCL RHP)",
  sourceUrl:"https://www.nseindia.com/companies-listing/corporate-filings-announcements?symbol=COALINDIA",
  note:"Coal India disclosed the Mahanadi Coalfields red-herring prospectus on 14 November. The announced offer window is 19–23 November 2026."
 },
 "watranarentals-ipo":{
  name:"Watrana Rentals",
  sourceLabel:"NSE · current public issues (SME / Emerge)",
  sourceUrl:"https://www.nseindia.com/market-data/all-upcoming-issues-ipo",
  note:"SME bidding scheduled 19–23 November 2026. Verify final conditions and NSE Emerge eligibility in the offer document."
 }
};
export function verifiedIpoReference(id){return VERIFIED_IPO_REFERENCES[id]||null;}
