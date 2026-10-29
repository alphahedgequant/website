import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const response=(body,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"private,no-store"}});
async function db(){
  if(!process.env.NEON_DATABASE_URL)throw Error("Progress storage unavailable");
  const sql=neon(process.env.NEON_DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS ahq_learn_progress (
    user_id TEXT NOT NULL, item_id TEXT NOT NULL, score INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT FALSE, attempts INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(user_id,item_id))`;
  return sql;
}
export async function GET(){
  const {userId}=auth();if(!userId)return response({error:"Sign in required"},401);
  try{const sql=await db();const rows=await sql`SELECT item_id,score,completed,attempts,updated_at FROM ahq_learn_progress WHERE user_id=${userId}`;
    return response({ok:true,progress:rows});}
  catch{return response({error:"Progress temporarily unavailable"},503);}
}
export async function POST(request){
  const {userId}=auth();if(!userId)return response({error:"Sign in required"},401);
  let body;try{body=await request.json();}catch{return response({error:"Invalid body"},400);}
  const id=String(body?.id||"");
  if(!/^(math-|prob-|stats-|markets-|econ-|calc-|risk-|deriv-|portfolio-|quant-|ml-|stochastic-|options-|llm-|interview-|mental-)[a-z0-9-]{1,75}$/.test(id))return response({error:"Invalid activity"},400);
  const score=Number(body.score);if(!Number.isInteger(score)||score<0||score>100)return response({error:"Invalid score"},400);
  const completed=body.completed===true;
  try{const sql=await db();
    const rows=await sql`INSERT INTO ahq_learn_progress (user_id,item_id,score,completed,attempts) VALUES (${userId},${id},${score},${completed},1)
      ON CONFLICT (user_id,item_id) DO UPDATE SET
      score=GREATEST(ahq_learn_progress.score,EXCLUDED.score),
      completed=ahq_learn_progress.completed OR EXCLUDED.completed,
      attempts=ahq_learn_progress.attempts+1,updated_at=now()
      RETURNING item_id,score,completed,attempts,updated_at`;
    return response({ok:true,record:rows[0]});}
  catch{return response({error:"Could not save progress"},503);}
}
