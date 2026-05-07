/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const { Client } = require("pg");

function loadEnvFile() {
  const content = fs.readFileSync(".env.local", "utf8");

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
  const url = new URL(env.POSTGRES_URL_NON_POOLING);

  const client = new Client({
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl: {
      rejectUnauthorized: false,
    },
  });

  await client.connect();
  const result = await client.query(`
    select external_code, receiver_name, submitted_at
    from public.orders
    order by submitted_at desc
    limit 10
  `);
  console.log(JSON.stringify(result.rows, null, 2));
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
