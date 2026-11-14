/** Verify GitHub Actions OIDC JWT exclusively from AHQ tournament refresh workflow. */
import {createPublicKey,verify as verifySignature} from "node:crypto";
const ISSUER="https://token.actions.githubusercontent.com";
const AUDIENCE="ahq-tournament-push-v1";
const REPO="alphahedgequant/website";
const WORKFLOW=REPO+"/.github/workflows/refresh-tournaments.yml@refs/heads/main";
const decode=s=>JSON.parse(Buffer.from(s,"base64url").toString("utf8"));
export async function verifyTournamentGithubToken(raw){
 if(typeof raw!=="string"||raw.length>12000||!raw.startsWith("Bearer "))return false;
 const parts=raw.slice(7).split(".");
 if(parts.length!==3||parts.some(x=>!x||x.length>8000))return false;
 let head,claims;try{head=decode(parts[0]);claims=decode(parts[1])}catch{return false}
 if(head.alg!=="RS256"||typeof head.kid!=="string")return false;
 const now=Math.floor(Date.now()/1000);
 if(claims.iss!==ISSUER||claims.aud!==AUDIENCE||claims.repository!==REPO||
   claims.ref!=="refs/heads/main"||claims.workflow_ref!==WORKFLOW||
   claims.sub!=="repo:"+REPO+":ref:refs/heads/main"||
   !["push","schedule","workflow_dispatch"].includes(claims.event_name)||
   !/^[0-9]{1,18}$/.test(String(claims.run_id||""))||
   typeof claims.exp!=="number"||claims.exp<=now||
   typeof claims.iat!=="number"||claims.iat>now+30||claims.iat<now-600||
   (claims.nbf!=null&&claims.nbf>now+30))return false;
 let keys;
 try{
   const r=await fetch(ISSUER+"/.well-known/jwks",{
     next:{revalidate:1200},signal:AbortSignal.timeout(7000)});
   if(!r.ok)return false;
   keys=(await r.json()).keys;
 }catch{return false}
 const jwk=keys?.find(k=>k.kid===head.kid&&k.kty==="RSA"&&k.use==="sig"&&k.alg==="RS256");
 if(!jwk)return false;
 try{
   const key=createPublicKey({key:jwk,format:"jwk"});
   return verifySignature("RSA-SHA256",Buffer.from(parts[0]+"."+parts[1]),key,Buffer.from(parts[2],"base64url"));
 }catch{return false}
}
