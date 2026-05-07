import path from "node:path";

import { describe, expect, it } from "vitest";

import { readWorkbookFromFile } from "@/lib/excel";
import { analyzeWorkbook } from "@/lib/template-detection";
import { validateOrders } from "@/lib/validation";

const sample = (fileName: string) => path.join(process.cwd(), "public", "samples", fileName);

describe("analyzeWorkbook", () => {
  it("detects the standard chinese template", () => {
    const result = analyzeWorkbook(readWorkbookFromFile(sample("template1-standard.xlsx")), "template1-standard.xlsx");

    expect(result.selectedSheetName).toBe("订单导入");
    expect(result.rows).toHaveLength(5);
    expect(result.mapping.senderName).toBe("发件人姓名");
    expect(result.mapping.receiverName).toBe("收件人姓名");
    expect(result.rows[0]?.externalCode).toBe("ORD-2024-001");
  });

  it("detects ecommerce template with a description row", () => {
    const result = analyzeWorkbook(readWorkbookFromFile(sample("template2-ecommerce.xlsx")), "template2-ecommerce.xlsx");

    expect(result.selectedSheetName).toBe("Sheet1");
    expect(result.mapping.externalCode).toBe("外部订单号");
    expect(result.mapping.packageCount).toBe("数量");
    expect(result.rows[0]?.receiverName).toBe("李四");
  });

  it("detects english aliases", () => {
    const result = analyzeWorkbook(readWorkbookFromFile(sample("template3-english.xlsx")), "template3-english.xlsx");

    expect(result.mapping.externalCode).toBe("Ref Code");
    expect(result.mapping.senderName).toBe("Sender");
    expect(result.mapping.receiverPhone).toBe("Receiver Tel");
  });

  it("detects grouped headers by picking the second row", () => {
    const result = analyzeWorkbook(readWorkbookFromFile(sample("template4-grouped.xlsx")), "template4-grouped.xlsx");

    const activeSheet = result.availableSheets.find((sheet) => sheet.sheetName === result.selectedSheetName);
    expect(activeSheet?.headerCandidate?.rowIndex).toBe(1);
    expect(result.mapping.externalCode).toBe("外部编码");
    expect(result.rows[0]?.remark).toBe("易碎品");
  });

  it("prefers the data sheet over the instructions sheet in a multi-sheet workbook", () => {
    const result = analyzeWorkbook(readWorkbookFromFile(sample("template5-multisheet.xlsx")), "template5-multisheet.xlsx");

    expect(result.selectedSheetName).toBe("订单数据");
    expect(result.mapping.externalCode).toBe("客户单号");
    expect(result.rows[0]?.temperatureZone).toBe("常温");
  });
});

describe("validateOrders", () => {
  it("returns all validation errors at once", () => {
    const result = analyzeWorkbook(readWorkbookFromFile(sample("template1-standard.xlsx")), "template1-standard.xlsx");
    const rows = result.rows.map((row) => ({ ...row, batchCode: "BATCH-001" }));
    rows[0].receiverPhone = "abc";
    rows[1].weightKg = "0";
    rows[2].packageCount = "2.5";
    rows[3].temperatureZone = "低温";
    rows[4].externalCode = "ORD-2024-001";

    const errors = validateOrders(rows, ["ORD-2024-003"]);

    expect(errors.some((error) => error.field === "receiverPhone")).toBe(true);
    expect(errors.some((error) => error.field === "weightKg")).toBe(true);
    expect(errors.some((error) => error.field === "packageCount")).toBe(true);
    expect(errors.some((error) => error.field === "temperatureZone")).toBe(true);
    expect(errors.some((error) => error.code === "duplicate_in_batch")).toBe(true);
    expect(errors.some((error) => error.code === "duplicate_in_database")).toBe(true);
  });
});
