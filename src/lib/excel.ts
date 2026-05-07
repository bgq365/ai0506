import * as XLSX from "xlsx";

export function readWorkbookFromFile(filePath: string) {
  return XLSX.readFile(filePath, {
    cellDates: false,
    dense: true,
  });
}
