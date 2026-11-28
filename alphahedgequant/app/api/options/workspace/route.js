// Cloud-saved Options Intelligence workspaces, appearance preferences and "since your last visit"
// markers for the signed-in Clerk user. Layout configuration only — never market data or secrets.
import { auth, currentUser } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { sanitizeWorkspace, sanitizePrefs, sanitizeLastVisit } from "@/lib/optionsWorkspace.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BODY = 64 * 1024;
const reply = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private,no-store" } });

async function db() {
  if (!process.env.NEON_DATABASE_URL) throw Error("Workspace storage unavailable");
  const sql = neon(process.env.NEON_DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS ahq_options_workspace (
    user_id TEXT PRIMARY KEY,
    workspaces JSONB NOT NULL DEFAULT '[]'::jsonb,
    prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_visit JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
  return sql;
}

/** BASIC/PRO entitlement. Packaging is not decided yet, so every signed-in user is PRO unless
 *  OPTIONS_ENTITLEMENT_MODE=enforce, in which case Clerk publicMetadata.optionsPlan === "pro" is required. */
async function planFor() {
  if (process.env.OPTIONS_ENTITLEMENT_MODE !== "enforce") return "pro";
  try { const u = await currentUser(); return u?.publicMetadata?.optionsPlan === "pro" ? "pro" : "basic"; }
  catch { return "basic"; }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return reply({ error: "Sign in required" }, 401);
  const plan = await planFor();
  try {
    const sql = await db();
    const rows = await sql`SELECT workspaces, prefs, last_visit, updated_at FROM ahq_options_workspace WHERE user_id=${userId}`;
    const r = rows[0];
    return reply({ ok: true, plan, workspaces: r?.workspaces || [], prefs: r?.prefs || {}, lastVisit: r?.last_visit || {}, updatedAt: r?.updated_at || null });
  } catch {
    return reply({ ok: false, plan, error: "Workspace storage temporarily unavailable" }, 503);
  }
}

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) return reply({ error: "Sign in required" }, 401);
  const text = await request.text();
  if (text.length > MAX_BODY) return reply({ error: "Workspace payload too large" }, 413);
  let body;
  try { body = JSON.parse(text); } catch { return reply({ error: "Invalid body" }, 400); }
  const workspaces = (Array.isArray(body?.workspaces) ? body.workspaces : []).slice(0, 20).map(sanitizeWorkspace).filter(Boolean);
  const prefs = sanitizePrefs(body?.prefs);
  const lastVisit = sanitizeLastVisit(body?.lastVisit);
  try {
    const sql = await db();
    await sql`INSERT INTO ahq_options_workspace (user_id, workspaces, prefs, last_visit)
      VALUES (${userId}, ${JSON.stringify(workspaces)}::jsonb, ${JSON.stringify(prefs)}::jsonb, ${JSON.stringify(lastVisit)}::jsonb)
      ON CONFLICT (user_id) DO UPDATE SET workspaces=EXCLUDED.workspaces, prefs=EXCLUDED.prefs,
        last_visit=EXCLUDED.last_visit, updated_at=now()`;
    return reply({ ok: true, saved: { workspaces: workspaces.length } });
  } catch {
    return reply({ error: "Could not save workspace" }, 503);
  }
}
