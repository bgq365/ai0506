# Parcel Pivot

多模板 Excel 自动导入下单系统，基于 `Next.js App Router + TypeScript + Supabase + Vercel`。

## 功能概览

- 上传 `.xls` / `.xlsx` 文件，支持点击上传与拖拽上传
- 自动识别多种模板表头、列顺序、英文别名、多 Sheet
- 手动调整列映射，并保存模板学习结果
- 预览表格支持直接编辑、删除行、新增空行、导出 Excel
- 一次性展示全部校验错误
- 提交合法运单到 Supabase
- 查看已导入运单历史，支持条件筛选

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

```bash
cp .env.example .env.local
```

填入：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

3. 初始化 Supabase 表结构

将 [supabase/schema.sql](/D:/AIProjects/ai0506/supabase/schema.sql) 执行到你的 Supabase SQL Editor。

4. 启动开发环境

```bash
npm run dev
```

5. 验证

```bash
npm run lint
npm run build
npm run test
```

## 样例模板

题目给出的 5 份样例文件已复制到 [public/samples](/D:/AIProjects/ai0506/public/samples)：

- `template1-standard.xlsx`
- `template2-ecommerce.xlsx`
- `template3-english.xlsx`
- `template4-grouped.xlsx`
- `template5-multisheet.xlsx`

## 页面与接口

- `/` 导入工作台
- `/orders` 已导入运单
- `POST /api/orders/check-duplicates`
- `POST /api/orders/submit`
- `GET /api/orders`
- `GET|POST /api/template-mappings`
- `GET /api/health`

## 部署到 Vercel

1. 将仓库推到 GitHub
2. 在 Vercel 导入该项目
3. 配置 `.env.example` 中的 3 个变量
4. 重新部署

## 考试提交参考

### 在线地址

部署完成后填写你的 Vercel Production URL。

### Git 地址

当前仓库远程地址：

- `git@github.com:bgq365/ai0506.git`

如果考试系统需要公开链接，填写对应 HTTPS 地址：

- `https://github.com/bgq365/ai0506`

### 反思题草稿

1. 最容易忽略的 3 个细节

- 多 Sheet 误判：如果只读第一个 Sheet，很容易把“填写说明”当成数据页，实际导入会直接错位。
- 错误全量展示：很多人会写成一次只报一个错误，但题目明确要求一次性列出所有错误和具体行号字段。
- 模板学习签名：如果不把 `sheet + headerRow + normalized headers + columnCount` 固定成签名，下次就很难准确复用用户手动映射。

2. 纯人工编码预计时间

- 预计 1.5 到 2.5 天。
- 原因是这不是普通 CRUD 页面，真正耗时点在 Excel 模板兼容、表格编辑交互、全量校验、模板学习、数据库落库和部署联调。
