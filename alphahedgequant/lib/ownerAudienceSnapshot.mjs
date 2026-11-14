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
