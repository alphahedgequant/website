import {neon} from "@neondatabase/serverless";
// Existing Neon database; writes occur only in authenticated server-side jobs.
let ready=null;
export function flowDB(){
 if(!process.env.NEON_DATABASE_URL)throw Error("FLOW_DATABASE_NOT_CONFIGURED");
 return neon(process.env.NEON_DATABASE_URL);
}
export async function ensureFlowTables(sql){
 if(!ready)ready=(async()=>{
  await sql`CREATE TABLE IF NOT EXISTS ahq_options_flow_observations (
   trading_day DATE NOT NULL,symbol VARCHAR(40) NOT NULL,
   slot SMALLINT NOT NULL CHECK(slot BETWEEN 0 AND 7),
   expiry DATE NOT NULL,observed_at TIMESTAMPTZ NOT NULL,
   backend_received_at TIMESTAMPTZ,
   spot NUMERIC,call_volume NUMERIC NOT NULL,put_volume NUMERIC NOT NULL,
   call_oi NUMERIC NOT NULL,put_oi NUMERIC NOT NULL,
   pcr_oi NUMERIC,pcr_volume NUMERIC,contract_count INT NOT NULL,
   alert_count INT NOT NULL,activity_score INT NOT NULL,
   top_contracts JSONB NOT NULL DEFAULT '[]'::jsonb,
   PRIMARY KEY(trading_day,symbol,slot)
  )`;
  await sql`CREATE INDEX IF NOT EXISTS ahq_options_flow_day_idx ON ahq_options_flow_observations(trading_day DESC,activity_score DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS ahq_options_flow_symbol_idx ON ahq_options_flow_observations(symbol,trading_day DESC,observed_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS ahq_options_flow_runs (
   trading_day DATE NOT NULL,slot SMALLINT NOT NULL CHECK(slot BETWEEN 0 AND 7),
   checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   eligible_count INT NOT NULL,planned_count INT NOT NULL,
   captured_count INT NOT NULL,unavailable_count INT NOT NULL,
   status TEXT NOT NULL CHECK(status IN ('captured','partial','unavailable')),
   PRIMARY KEY(trading_day,slot)
  )`;
 })().catch(e=>{ready=null;throw e});
 return ready;
}
export async function storeFlowBatch(sql,{day,slot,eligibleCount,plannedCount,observations,unavailableCount}){
 await ensureFlowTables(sql);
 if(observations.length){
  const payload=JSON.stringify(observations.map(x=>({
   day,slot,symbol:x.symbol,expiry:x.expiry,at:x.receivedAt,backendAt:x.backendReceivedAt,
   spot:x.spot,totals:x.totals,oiPCR:x.pcrOI,volumePCR:x.pcrVolume,
   contracts:x.contractCount,alertCount:x.alertCount,score:x.score,top:x.topContracts
  })));
  await sql`INSERT INTO ahq_options_flow_observations
   (trading_day,slot,symbol,expiry,observed_at,backend_received_at,spot,
    call_volume,put_volume,call_oi,put_oi,pcr_oi,pcr_volume,contract_count,
    alert_count,activity_score,top_contracts)
   SELECT x.day::date,x.slot,x.symbol,x.expiry::date,x.at::timestamptz,
    NULLIF(x.backendAt,'')::timestamptz,x.spot,
    COALESCE((x.totals->>'callVolume')::numeric,0),
    COALESCE((x.totals->>'putVolume')::numeric,0),
    COALESCE((x.totals->>'callOI')::numeric,0),
    COALESCE((x.totals->>'putOI')::numeric,0),
    x.oiPCR,x.volumePCR,x.contracts,x.alertCount,x.score,x.top
   FROM jsonb_to_recordset(${payload}::jsonb)
    AS x(day text,slot smallint,symbol text,expiry text,at text,
     backendAt text,spot numeric,totals jsonb,oiPCR numeric,volumePCR numeric,
     contracts int,alertCount int,score int,top jsonb)
   WHERE true
   ON CONFLICT (trading_day,symbol,slot) DO UPDATE SET
    expiry=EXCLUDED.expiry,observed_at=EXCLUDED.observed_at,
    backend_received_at=EXCLUDED.backend_received_at,spot=EXCLUDED.spot,
    call_volume=EXCLUDED.call_volume,put_volume=EXCLUDED.put_volume,
    call_oi=EXCLUDED.call_oi,put_oi=EXCLUDED.put_oi,
    pcr_oi=EXCLUDED.pcr_oi,pcr_volume=EXCLUDED.pcr_volume,
    contract_count=EXCLUDED.contract_count,alert_count=EXCLUDED.alert_count,
    activity_score=EXCLUDED.activity_score,top_contracts=EXCLUDED.top_contracts
   WHERE EXCLUDED.observed_at>ahq_options_flow_observations.observed_at`;
 }
 const captured=observations.length;
 const status=!captured?"unavailable":captured<plannedCount?"partial":"captured";
 await sql`INSERT INTO ahq_options_flow_runs
  (trading_day,slot,checked_at,eligible_count,planned_count,captured_count,unavailable_count,status)
  VALUES (${day}::date,${slot},NOW(),${eligibleCount},${plannedCount},
   ${captured},${unavailableCount},${status})
  ON CONFLICT(trading_day,slot) DO UPDATE SET
   checked_at=NOW(),eligible_count=EXCLUDED.eligible_count,
   planned_count=EXCLUDED.planned_count,captured_count=EXCLUDED.captured_count,
   unavailable_count=EXCLUDED.unavailable_count,status=EXCLUDED.status`;
 return status;
}
export async function readFlowDay(sql,day){
 await ensureFlowTables(sql);
 const [rows,runs]=await Promise.all([
  sql`SELECT DISTINCT ON(symbol) symbol,trading_day::text AS day,
   expiry::text AS expiry,observed_at::text AS observed_at,
   backend_received_at::text AS backend_received_at,slot,spot,
   call_volume::float8 AS call_volume,put_volume::float8 AS put_volume,
   call_oi::float8 AS call_oi,put_oi::float8 AS put_oi,
   pcr_oi::float8 AS pcr_oi,pcr_volume::float8 AS pcr_volume,
   contract_count,alert_count,activity_score
   FROM ahq_options_flow_observations WHERE trading_day=${day}::date
   ORDER BY symbol,observed_at DESC LIMIT 350`,
  sql`SELECT slot,checked_at::text AS checked_at,eligible_count,planned_count,
   captured_count,unavailable_count,status
   FROM ahq_options_flow_runs WHERE trading_day=${day}::date ORDER BY slot`
 ]);
 const items=[...rows].sort((a,b)=>b.activity_score-a.activity_score||b.alert_count-a.alert_count||a.symbol.localeCompare(b.symbol));
 const eligible=runs.length?Math.max(...runs.map(x=>x.eligible_count)):null;
 return {day,items,coverage:{
  eligible,observed:items.length,batches:runs.length,scheduledBatches:8,
  incomplete:runs.length<8||runs.some(x=>x.status!=="captured")||
    (eligible!==null&&items.length<eligible)
 },runs};
}
export async function readFlowTicker(sql,symbol,limit=45){
 await ensureFlowTables(sql);
 return sql`SELECT DISTINCT ON(trading_day) symbol,trading_day::text AS day,
  expiry::text AS expiry,observed_at::text AS observed_at,
  backend_received_at::text AS backend_received_at,slot,spot,
  call_volume::float8 AS call_volume,put_volume::float8 AS put_volume,
  call_oi::float8 AS call_oi,put_oi::float8 AS put_oi,
  pcr_oi::float8 AS pcr_oi,pcr_volume::float8 AS pcr_volume,
  contract_count,alert_count,activity_score,top_contracts
  FROM ahq_options_flow_observations WHERE symbol=${symbol}
  ORDER BY trading_day DESC,observed_at DESC
  LIMIT ${Math.min(70,Math.max(1,limit))}`;
}
