/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const { createClient } = require("@supabase/supabase-js");

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
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const stamp = Math.floor(Date.now() / 1000);
  const batchId = `smoke-${stamp}`;
  const externalCode = `SMOKE-${stamp}`;

  const batchInsert = await supabase.from("import_batches").insert({
    id: batchId,
    file_name: "smoke-script.xlsx",
    template_signature: "smoke::script",
    success_count: 1,
    failed_count: 0,
    submitted_at: new Date().toISOString(),
  });

  if (batchInsert.error) {
    throw batchInsert.error;
  }

  const orderInsert = await supabase.from("orders").insert({
    batch_id: batchId,
    template_signature: "smoke::script",
    file_name: "smoke-script.xlsx",
    submitted_at: new Date().toISOString(),
    external_code: externalCode,
    sender_name: "测试发件人",
    sender_phone: "13800138000",
    sender_address: "北京市朝阳区测试路1号",
    receiver_name: "测试收件人",
    receiver_phone: "13900139000",
    receiver_address: "上海市浦东新区测试路2号",
    weight_kg: 2.5,
    package_count: 1,
    temperature_zone: "常温",
    remark: "smoke insert",
  });

  if (orderInsert.error) {
    throw orderInsert.error;
  }

  const verify = await supabase
    .from("orders")
    .select("external_code, receiver_name, submitted_at")
    .eq("external_code", externalCode)
    .limit(1);

  if (verify.error) {
    throw verify.error;
  }

  console.log(JSON.stringify({ batchId, externalCode, verify: verify.data }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
