/**
 * Native RFC 8291 aes128gcm Web Push + RFC 8292 VAPID.
 * No npm dependencies. The VAPID private key stays in Vercel secrets.
 */
import {createECDH,createPrivateKey,createCipheriv,createHmac,randomBytes,sign} from "node:crypto";
import {neon} from "@neondatabase/serverless";
const b64=x=>Buffer.from(x).toString("base64url");
const from=x=>Buffer.from(String(x||""),"base64url");
const publicKey=()=>process.env.AHQ_TOURNAMENT_VAPID_PUBLIC||"";
const privateKey=()=>process.env.AHQ_TOURNAMENT_VAPID_PRIVATE||"";
export const configured=()=>Boolean(publicKey()&&privateKey()&&process.env.NEON_DATABASE_URL);
export const getPublicKey=()=>configured()?publicKey():null;
export async function ensurePushTable(){
 if(!process.env.NEON_DATABASE_URL)throw Error("Database unavailable");
 const db=neon(process.env.NEON_DATABASE_URL);
 await db`CREATE TABLE IF NOT EXISTS ahq_tournament_push (
   endpoint TEXT PRIMARY KEY,
   p256dh TEXT NOT NULL,
   auth TEXT NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 )`;
 return db;
}
const allowedHost=host=>/(?:^|\.)fcm\.googleapis\.com$|(?:^|\.)push\.services\.mozilla\.com$|(?:^|\.)updates\.push\.services\.mozilla\.com$|(?:^|\.)push\.apple\.com$|(?:^|\.)web\.push\.apple\.com$|(?:^|\.)notify\.windows\.com$|(?:^|\.)wns\.windows\.com$/.test(host);
export function validateSubscription(p){
 if(!p||typeof p!=="object"||typeof p.endpoint!=="string"||!p.keys)return null;
 if(p.endpoint.length>1800)return null;
 let url;try{url=new URL(p.endpoint)}catch{return null}
 if(url.protocol!=="https:"||url.username||url.password||url.port||!allowedHost(url.hostname.toLowerCase()))return null;
 const pub=String(p.keys.p256dh||""),auth=String(p.keys.auth||"");
 if(!/^[A-Za-z0-9_-]{86,90}$/.test(pub)||!/^[A-Za-z0-9_-]{20,30}$/.test(auth))return null;
 if(from(pub).length!==65||from(pub)[0]!==4||from(auth).length!==16)return null;
 return {endpoint:url.href,p256dh:pub,auth};
}
const hmac=(key,data)=>createHmac("sha256",key).update(data).digest();
function expand(prk,info,length){
 let prev=Buffer.alloc(0),out=Buffer.alloc(0);
 for(let counter=1;out.length<length;counter++){
   prev=hmac(prk,Buffer.concat([prev,Buffer.from(info),Buffer.from([counter])]));
   out=Buffer.concat([out,prev]);
 }
 return out.subarray(0,length);
}
function authorization(endpoint){
 const pub=from(publicKey()),priv=from(privateKey());
 if(pub.length!==65||priv.length!==32)throw Error("Invalid VAPID keys");
 const jwk={kty:"EC",crv:"P-256",x:b64(pub.subarray(1,33)),y:b64(pub.subarray(33,65)),d:b64(priv)};
 const key=createPrivateKey({key:jwk,format:"jwk"});
 const header=b64(JSON.stringify({typ:"JWT",alg:"ES256"}));
 const claims=b64(JSON.stringify({aud:new URL(endpoint).origin,exp:Math.floor(Date.now()/1000)+3600,sub:"https://www.alphahedgequant.com"}));
 const input=header+"."+claims;
 return "vapid t="+input+"."+b64(sign("sha256",Buffer.from(input),{key,dsaEncoding:"ieee-p1363"}))+", k="+publicKey();
}
function encrypt(subscription,text){
 const subscriber=from(subscription.p256dh),auth=from(subscription.auth);
 const ecdh=createECDH("prime256v1");ecdh.generateKeys();
 const ephemeral=ecdh.getPublicKey(),shared=ecdh.computeSecret(subscriber);
 const ikm=expand(hmac(auth,shared),Buffer.concat([Buffer.from("WebPush: info\0"),subscriber,ephemeral]),32);
 const salt=randomBytes(16),prk=hmac(salt,ikm);
 const key=expand(prk,Buffer.from("Content-Encoding: aes128gcm\0"),16);
 const nonce=expand(prk,Buffer.from("Content-Encoding: nonce\0"),12);
 const plain=Buffer.concat([Buffer.from(text,"utf8"),Buffer.from([2])]);
 if(plain.length>3900)throw Error("Push payload too large");
 const cipher=createCipheriv("aes-128-gcm",key,nonce);
 const encrypted=Buffer.concat([cipher.update(plain),cipher.final(),cipher.getAuthTag()]);
 const record=Buffer.alloc(4);record.writeUInt32BE(4096);
 return Buffer.concat([salt,record,Buffer.from([ephemeral.length]),ephemeral,encrypted]);
}
export async function deliverPush(subscription,payload){
 const valid=validateSubscription(subscription);
 if(!valid||!configured())throw Error("Push subscriber/config invalid");
 const body=encrypt(valid,JSON.stringify(payload));
 const r=await fetch(valid.endpoint,{method:"POST",redirect:"error",
   headers:{"TTL":"3600","Urgency":"normal","Content-Type":"application/octet-stream",
     "Content-Encoding":"aes128gcm","Authorization":authorization(valid.endpoint)},
   body,signal:AbortSignal.timeout(10000)});
 return {status:r.status,ok:r.ok,invalid:r.status===404||r.status===410};
}
