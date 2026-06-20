// app/api/tracker/calls/[id]/route.js
// DELETE a single analyst call by id.
import { neon } from "@neondatabase/serverless";

export async function DELETE(request, { params }) {
  try {
    if (!process.env.NEON_DATABASE_URL) {
      return Response.json({ success: false, error: "Database not configured." }, { status: 500 });
    }
    const id = Number(params.id);
    if (!id) return Response.json({ success: false, error: "Invalid id." }, { status: 400 });
    const sql = neon(process.env.NEON_DATABASE_URL);
    await sql`DELETE FROM analyst_calls WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (e) {
    console.error("[Tracker DELETE]", e);
    return Response.json({ success: false, error: "Could not delete call." }, { status: 500 });
  }
}
