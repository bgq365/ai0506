export const CANONICAL_FIELDS = [
  "externalCode",
  "senderName",
  "senderPhone",
  "senderAddress",
  "receiverName",
  "receiverPhone",
  "receiverAddress",
  "weightKg",
  "packageCount",
  "temperatureZone",
  "remark",
] as const;

export const REQUIRED_FIELDS = [
  "senderName",
  "senderPhone",
  "senderAddress",
  "receiverName",
  "receiverPhone",
  "receiverAddress",
  "weightKg",
  "packageCount",
  "temperatureZone",
] as const;

export const TEMPERATURE_OPTIONS = ["常温", "冷藏", "冷冻"] as const;

export const CANONICAL_FIELD_LABELS = {
  externalCode: "外部编码",
  senderName: "发件人姓名",
  senderPhone: "发件人电话",
  senderAddress: "发件人地址",
  receiverName: "收件人姓名",
  receiverPhone: "收件人电话",
  receiverAddress: "收件人地址",
  weightKg: "重量 (kg)",
  packageCount: "件数",
  temperatureZone: "温层",
  remark: "备注",
} as const;

export const FIELD_DESCRIPTION = {
  externalCode: "外部系统订单唯一编号，用于去重",
  senderName: "寄件人姓名",
  senderPhone: "寄件人联系方式",
  senderAddress: "寄件人完整地址",
  receiverName: "收货人姓名",
  receiverPhone: "收货人联系方式",
  receiverAddress: "收货人完整地址",
  weightKg: "货物重量，必须为正数",
  packageCount: "包裹数量，必须为正整数",
  temperatureZone: "常温 / 冷藏 / 冷冻",
  remark: "附加说明",
} as const;

export const FIELD_SYNONYMS = {
  externalCode: [
    "外部编码",
    "外部订单号",
    "客户单号",
    "refcode",
    "ref code",
    "externalcode",
    "orderno",
  ],
  senderName: ["发件人姓名", "发件人", "发货人", "sender", "sendername", "寄件人"],
  senderPhone: [
    "发件人电话",
    "发件电话",
    "发货电话",
    "sendertel",
    "senderphone",
    "寄件人电话",
  ],
  senderAddress: [
    "发件人地址",
    "发件地址",
    "发货地址",
    "senderaddress",
    "寄件地址",
  ],
  receiverName: ["收件人姓名", "收件人", "收货人", "收方", "receiver", "receivername"],
  receiverPhone: [
    "收件人电话",
    "收件电话",
    "收货电话",
    "receivertel",
    "receiverphone",
    "收货人联系方式",
  ],
  receiverAddress: [
    "收件人地址",
    "收件地址",
    "收货地址",
    "receiveraddress",
    "收货人完整地址",
  ],
  weightKg: ["重量kg", "重量", "weight", "weightkg", "weight(kg)", "重量(k g)"],
  packageCount: ["件数", "数量", "qty", "packagecount", "包裹数量"],
  temperatureZone: ["温层", "温度要求", "tempzone", "temperaturezone", "temp"],
  remark: ["备注", "附言", "note", "remark"],
} as const;

export const ADDRESS_GROUP_ALIASES = {
  senderAddress: ["发件省", "发件市", "发件区", "发件详细地址", "senderprovince", "sendercity", "senderdistrict"],
  receiverAddress: ["收件省", "收件市", "收件区", "收件详细地址", "receiverprovince", "receivercity", "receiverdistrict"],
} as const;

export const SAMPLE_TEMPLATE_FILES = [
  "template1-standard.xlsx",
  "template2-ecommerce.xlsx",
  "template3-english.xlsx",
  "template4-grouped.xlsx",
  "template5-multisheet.xlsx",
] as const;
