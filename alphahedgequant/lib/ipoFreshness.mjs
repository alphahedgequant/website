// IPO feed timestamps must be grounded in the upstream feed, not in the
// time this API happened to fetch or cache the response.
export function ipoFreshness(input, now=Date.now()) {
  let ms;
  if (typeof input==="string"&&input.trim()) {
    ms=Date.parse(input);
  } else if (typeof input==="number"&&Number.isFinite(input)) {
    ms=input<1e11?input*1000:input;
  } else ms=NaN;
  if (!Number.isFinite(ms)||!Number.isFinite(now)||ms>now+60*60*1000)
    return {upstreamUpdatedAt:null,stale:null,freshness:"unknown"};
  const age=Math.max(0,now-ms);
  const stale=age>48*60*60*1000;
  return {upstreamUpdatedAt:new Date(ms).toISOString(),stale,freshness:stale?"possibly_stale":"timestamp_within_48h"};
}
