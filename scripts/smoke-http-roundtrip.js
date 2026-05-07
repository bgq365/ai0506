const code = `HTTP-SMOKE-${Math.floor(Date.now() / 1000)}`;

async function main() {
  const submitResponse = await fetch("https://ai0506.vercel.app/api/orders/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: "http-smoke.xlsx",
      templateSignature: "http::smoke",
      rows: [
        {
          rowId: "http-smoke-row-1",
          rowIndex: 1,
          sourceSheet: "Smoke",
          externalCode: code,
          senderName: "测试发件人",
          senderPhone: "13800138000",
          senderAddress: "北京市朝阳区测试路1号",
          receiverName: "测试收件人",
          receiverPhone: "13900139000",
          receiverAddress: "上海市浦东新区测试路2号",
          weightKg: "2.5",
          packageCount: "1",
          temperatureZone: "常温",
          remark: "http smoke",
        },
      ],
    }),
  });

  const submitBody = await submitResponse.text();
  console.log(JSON.stringify({ submitStatus: submitResponse.status, submitBody }, null, 2));

  const listResponse = await fetch(
    `https://ai0506.vercel.app/api/orders?page=1&pageSize=5&externalCode=${encodeURIComponent(code)}`,
  );
  const listBody = await listResponse.text();
  console.log(JSON.stringify({ listStatus: listResponse.status, listBody }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
