// Read-only PostgreSQL security posture check.
// Run only with a trusted server-side NEON_DATABASE_URL secret. Never print URL,
// role names, table names, connection strings, data, or individual user records.
import {neon} from "@neondatabase/serverless";

if (!process.env.NEON_DATABASE_URL) {
  console.error("BLOCKED: GitHub Actions NEON_DATABASE_URL secret is not configured.");
  process.exit(2);
}

try {
  const sql=neon(process.env.NEON_DATABASE_URL);
  const [role]=await sql`
    SELECT rolsuper,rolcreatedb,rolcreaterole,rolbypassrls,rolreplication
    FROM pg_catalog.pg_roles
    WHERE rolname=current_user
  `;
  if (!role) throw Error("Unable to inspect current database role");
  const [schema]=await sql`
    SELECT
      has_schema_privilege(current_user,'public','CREATE') AS can_create_public_tables,
      has_database_privilege(current_user,current_database(),'CREATE') AS can_create_schemas
  `;
  const [tables]=await sql`
    SELECT
      count(*)::integer AS public_tables,
      count(*) FILTER(WHERE NOT rowsecurity)::integer AS public_tables_without_rls
    FROM pg_catalog.pg_tables
    WHERE schemaname='public'
  `;
  const [ssl]=await sql`
    SELECT coalesce((SELECT s.ssl FROM pg_catalog.pg_stat_ssl s
      WHERE s.pid=pg_backend_pid()),false) AS ssl
  `;
  const checks={
    superuser:role.rolsuper===true,
    can_create_database:role.rolcreatedb===true,
    can_create_roles:role.rolcreaterole===true,
    bypass_row_level_security:role.rolbypassrls===true,
    replication_privilege:role.rolreplication===true,
    can_create_public_tables:schema.can_create_public_tables===true,
    can_create_schemas:schema.can_create_schemas===true,
    connection_ssl:ssl.ssl===true,
    public_table_count:Number(tables.public_tables),
    tables_without_rls:Number(tables.public_tables_without_rls)
  };
  console.log("PostgreSQL role/security audit (booleans and counts only):",JSON.stringify(checks));
  console.log("RLS count is diagnostic; it does not prove a vulnerability when app queries enforce authenticated tenant filtering.");
  if(checks.superuser||checks.bypass_row_level_security||!checks.connection_ssl){
    console.error("FAIL: role has elevated bypass privileges or connection is not using SSL.");
    process.exitCode=1;
  }else if(checks.can_create_roles||checks.can_create_database||checks.can_create_public_tables){
    console.warn("REVIEW: runtime database credentials can administer objects. Consider a separate least-privilege application role after migration.");
  }else{
    console.log("No database superuser, RLS bypass, or schema-management rights observed.");
  }
}catch{
  console.error("UNVERIFIED: read-only PostgreSQL audit failed. Check endpoint access and permissions privately.");
  process.exitCode=2;
}
