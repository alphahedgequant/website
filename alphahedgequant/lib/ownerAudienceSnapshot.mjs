// Parse a privately configured, owner-supplied reference snapshot.
// Never treat these numbers as measured traffic or authenticated Clerk totals.
export function parseOwnerAudienceSnapshot(raw){
 if(typeof raw!=="string"||!raw.trim())return null;
 try{
  const value=JSON.parse(raw);
  if(!value||typeof value!=="object"||Array.isArray(value))return null;
  if(!Number.isSafeInteger(value.totalUsers)||value.totalUsers<0)return null;
  if(!Number.isSafeInteger(value.dau)||value.dau<0)return null;
  if(typeof value.asOf!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value.asOf))return null;
  if(new Date(value.asOf+"T00:00:00.000Z").toISOString().slice(0,10)!==value.asOf)return null;
  return {totalUsers:value.totalUsers,dau:value.dau,asOf:value.asOf,source:"Owner-provided"};
 }catch{return null;}
}


// Preserve legacy, dated aggregate figures without fabricating a daily series.
// 'traffic' deliberately remains one combined metric: its original source was
// described as "page views / visitors", not as two separately verified counts.
export function parseHistoricalAudienceSnapshot(raw){
 if(typeof raw!=="string"||!raw.trim())return null;
 try{
  const value=JSON.parse(raw);
  if(!value||typeof value!=="object"||Array.isArray(value))return null;
  for(const field of ["traffic","registeredAccounts","dau"]){
   if(!Number.isSafeInteger(value[field])||value[field]<0)return null;
  }
  if(typeof value.period!=="string"||!/^\d{4}-(0[1-9]|1[0-2])$/.test(value.period))return null;
  if(typeof value.approxDaysBefore!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value.approxDaysBefore))return null;
  const date=new Date(value.approxDaysBefore+"T00:00:00Z");
  if(Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==value.approxDaysBefore)return null;
  if(value.period>=value.approxDaysBefore.slice(0,7))return null;
  return {traffic:value.traffic,registeredAccounts:value.registeredAccounts,dau:value.dau,
   period:value.period,relativeTo:value.approxDaysBefore};
 }catch{return null}
}
