/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  const content = fs.readFileSync(envPath, "utf8");

  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index);
        let value = line.slice(index + 1);
        if (value.startsWith("\"") && value.endsWith("\"")) {
          value = value.slice(1, -1);
        }
        return [key, value];
      }),
  );
}

async function main() {
  const env = loadEnvFile();
  const schemaSql = fs.readFileSync(path.join(process.cwd(), "supabase", "schema.sql"), "utf8");
  const databaseUrl = new URL(env.POSTGRES_URL_NON_POOLING);
  const client = new Client({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 5432),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.replace(/^\//, ""),
    ssl: {
      rejectUnauthorized: false,
    },
  });

  await client.connect();
  await client.query(schemaSql);

  const tables = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('orders', 'import_batches', 'template_mappings')
    order by table_name
  `);

  console.log(JSON.stringify(tables.rows, null, 2));
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
