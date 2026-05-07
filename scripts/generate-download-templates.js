/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");

const outputDir = path.join(process.cwd(), "public", "templates");
fs.mkdirSync(outputDir, { recursive: true });

const standardRows = [
  ["外部编码", "发件人姓名", "发件人电话", "发件人地址", "收件人姓名", "收件人电话", "收件人地址", "重量(kg)", "件数", "温层", "备注"],
  ["ORD-2024-001", "张三", "13800138001", "北京市朝阳区建国路88号", "李四", "13900139001", "上海市浦东新区陆家嘴路100号", 5.2, 2, "常温", "易碎品"],
];

const ecommerceRows = [
  ["说明：批次号请在导入工作台顶部填写，重量必须为正数，温层仅支持常温/冷藏/冷冻"],
  ["外部订单号", "发货人", "发货电话", "发货地址", "收货人", "收货电话", "收货地址", "重量(kg)", "数量", "温度要求", "附言"],
  ["EC-2024-001", "王五", "13800138002", "广州市天河区体育西路66号", "赵六", "13900139002", "深圳市南山区科技路200号", 3, 1, "冷藏", ""],
];

const groupedRows = [
  ["订单信息", "", "发件方信息", "", "", "收件方信息", "", "", "货物信息", "", ""],
  ["外部编码", "备注", "发件人", "发件电话", "发件地址", "收件人", "收件电话", "收件地址", "重量(kg)", "件数", "温层"],
  ["ORD-2024-003", "加急", "孙七", "13800138003", "成都市武侯区人民南路50号", "周八", "13900139003", "重庆市渝中区解放碑步行街1号", 10.5, 5, "冷冻"],
];

const englishRows = [
  ["Ref Code", "Sender", "Sender Tel", "Sender Address", "Receiver", "Receiver Tel", "Receiver Address", "Weight", "Qty", "Temp Zone", "Remark"],
  ["EN-2024-001", "Alice Zhang", "+86 13800138004", "88 Jianguo Road, Beijing", "Bob Li", "+86 13900139004", "100 Lujiazui Road, Shanghai", 2.8, 1, "常温", "English aliases"],
];

const instructionRows = [
  ["说明页"],
  ["本工作簿包含两个 Sheet，请将订单数据填写到“订单数据”页。"],
  ["批次号在系统页面自动生成，无需写入表格。"],
];

const multiSheetRows = [
  ["客户单号", "发件人姓名", "发件人电话", "发件人地址", "收件人姓名", "收件人电话", "收件人地址", "重量", "件数", "温层", "备注"],
  ["MS-2024-001", "陈一", "13800138005", "杭州市西湖区文三路90号", "钱二", "13900139005", "苏州市工业园区星湖街188号", 6.6, 3, "冷藏", "多Sheet数据页"],
];

function writeWorkbook(fileName, sheetName, rows) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, path.join(outputDir, fileName));
}

writeWorkbook("parcel-pivot-template-standard.xlsx", "标准导入", standardRows);
writeWorkbook("parcel-pivot-template-ecommerce.xlsx", "电商导入", ecommerceRows);
writeWorkbook("parcel-pivot-template-grouped.xlsx", "分组导入", groupedRows);
writeWorkbook("parcel-pivot-template-english.xlsx", "EnglishOrders", englishRows);

const multiSheetWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(multiSheetWorkbook, XLSX.utils.aoa_to_sheet(instructionRows), "填写说明");
XLSX.utils.book_append_sheet(multiSheetWorkbook, XLSX.utils.aoa_to_sheet(multiSheetRows), "订单数据");
XLSX.writeFile(multiSheetWorkbook, path.join(outputDir, "parcel-pivot-template-multisheet.xlsx"));

console.log("Templates generated:", fs.readdirSync(outputDir));
