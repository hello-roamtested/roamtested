# PROJECT.md — RoamTested 项目交接文档

> 这份文档是给**未来的你**和**未来的 AI 助手**看的项目地图。
> 每次大改动后更新它。最近一次全面重写：Phase 0/1/2 结构改造完成后。 28/07/2026

---

## 0. 一句话项目定位

RoamTested（roamtested.com）是一个**靠联盟营销盈利的测评内容站**，面向经常旅行的人和数字游民，实测他们需要的数字产品（eSIM、VPN，未来可能扩展到随身 WiFi、AI 工具等）。核心模式：**在当地实测 → 发布带评分的测评 → 通过联盟链接赚佣金**。当前主力品类是**去中国的 eSIM**。

---

## 1. 技术栈与部署

- **框架**：Astro（静态站点生成）+ 内容集合（content collections）
- **托管/部署**：Cloudflare Pages，从 GitHub 私有仓库 `hello-roamtested/roamtested` 自动构建部署
- **域名/DNS/邮箱**：Cloudflare（roamtested.com；邮件路由 hello@、partners@）
- **站点配置**：`astro.config.mjs` — `site: 'https://roamtested.com'`，`trailingSlash: 'always'`（所有网址结尾带斜杠）
- **构建命令**：`npm run build`（= `astro build`）；本地开发 `npm run dev`
- **SEO**：`@astrojs/sitemap` 自动生成 sitemap，已提交 Google Search Console

**部署铁律**：
- 每次向主分支提交 = 触发一次 Cloudflare 构建。免费版每月 500 次构建，对本项目远远够用，**构建次数不用省**。
- **构建失败不影响线上**：Cloudflare 保留上一次成功的部署。最新提交旁的绿勾 = 当前线上状态的唯一可靠标志。
- 唯一要注意：**互相依赖的改动必须放在同一次提交**（比如删了数据字段、就得同一次提交里改 schema），否则中间态会构建失败。

---

## 2. 目录结构导览（只列关键的）

```
src/
├─ content.config.ts        ← 【核心】数据结构定义(schema) + 构建质检网
├─ config/
│  ├─ metrics.ts            ← 【核心】评分体系:品类→指标集(插卡式)
│  ├─ affiliates.ts         ← 联盟链接的唯一解析入口
│  └─ site.ts               ← 站点全局配置(品牌、菜单、邮箱)
├─ content/
│  ├─ providers/en/*.json   ← 【核心】每家一个文件,装它的全部数据(唯一真相)
│  └─ posts/en/*.md         ← 测评/文章正文
├─ data/
│  └─ prices-meta.json      ← 价格核对日期(全局一个值)
├─ components/*.astro       ← 展示组件(评分卡、测速表、对比表…)
├─ layouts/*.astro          ← 页面骨架
├─ pages/                   ← 路由
│  ├─ index.astro           ← 首页排行榜(从集合派生)
│  ├─ [slug].astro          ← 测评页模板(从 posts + providers 生成)
│  ├─ *.mdx                 ← 三篇对比/优惠码文章(从集合读 commercial)
│  └─ 其它静态页
└─ styles/global.css
scripts/price-watch/         ← 价格监控脚本(独立运行,不碰网站数据)
```

---

## 3. 核心架构：单一数据源模型

**最重要的一条原则，务必守住：一家 provider = 一条记录 = 一个文件。每个事实只存一个地方。**

（历史背景：项目早期曾把同一家的数据分散在两个文件里——一个存评测、一个存商业数据 `data/providers.json`——导致"改一处忘另一处"的静默冲突。Phase 2 把它们合并了，`data/providers.json` 已删除。**不要再引入第二个存放同类数据的地方。**）

### 一条 provider 记录的字段（`src/content/providers/en/<家名>.json`）

顶层字段（完整定义见 `content.config.ts`）：

- **身份**：`name`、`lang`（默认 en）、`category`（默认 esim；决定用哪套评分指标）
- **商业**：`commercial`（对象）—— **联盟链接、价格、优惠码等所有商业数据的唯一存放处**
  - `commercial.affiliate_url` —— 联盟链接（唯一）
  - 其余字段各家不一，原样存放（如 `china_2d_500mb`、`promo_code`、`monthly`、`referral_amount`…）
- **测评**（可选，没有就代表"已收录但还没测"）：`verdict`、`price.headline`、`scores`、`appAccess`、`speedTests`、`throttleAfterCap`、`exitCountry`、`pros`、`cons`
- **开关**：`sampleData`（true 时页面显示黄色"演示数据"横幅）、`listed`（是否上首页排行榜，默认 true）、`listedSpeedTests`（是否上测速库页面）
- **关联**：`reviewSlug`（指向对应测评文章的 slug，没有就省略）

### 联盟链接怎么被取用

全站所有"购买/查价"按钮的链接，都由 `src/config/affiliates.ts` 的 `affiliateUrlFor(provider)` 解析，它只读 `provider.data.commercial.affiliate_url`。**换联盟 ID / 子追踪标签，永远只改那一家记录的这一处。**

---

## 4. 评分体系：品类"插卡式"（`src/config/metrics.ts`）

评分不是写死的，而是**"品类 → 指标集"的映射**（`METRICS_BY_CATEGORY`）：

- `esim`：appAccess 30 / speed 25 / price 25 / activation 10 / usability 10（合计 100）
- `vpn`：**空占位** `[]` —— 等真正做 VPN 测评时再填（速度/隐私/流媒体解锁/服务器/价格之类，合计 100）

关键函数：`metricsFor(category)` 取某品类的指标集；`overallScore(scores, category)` 按品类加权算总分。评分卡、对比表、结构化数据、质检网全都按每家的 `category` 自动取对应指标集。

**加一个新品类（如随身 WiFi）** = 在 `METRICS_BY_CATEGORY` 里登记一行指标集 + 该品类的 provider 文件把 `category` 写成新名字。不改模板、不改结构。

---

## 5. 构建质检网（隐形保护，未来 AI 必读）

`content.config.ts` 里除了定义数据结构，还有一套**跨文件校验**：任何一条被破坏，**构建当场失败并报中文错误**，坏数据到不了线上。这是防"静默 bug"的核心，改动数据结构时不要削弱它。

现有规则：

1. **category 必须是 metrics.ts 里登记过的品类**（防拼错品类名）。
2. **scores 键必须和该品类的指标集完全一致**（真实数据强制；演示数据 `sampleData:true` 放行；品类指标为空的如 VPN 占位放行）。
3. **上榜的真实服务商（listed:true）必须有 scores**（否则排行榜没法显示分数；只有市场存根 listed:false 才豁免）。
4. **reviewSlug 必须指向真实存在的文章**（防悬空指针）。
5. **文章的 provider 必须指向真实存在的服务商**（防 trip-com/tripcom 那种命名对不上）。

这套校验**自动递归扫描整个 providers/posts 目录树**，所以将来无论文件怎么分文件夹放，都不用回来改校验逻辑。

---

## 6. 页面是怎么生成的

- **首页排行榜**（`index.astro` → `ComparisonTable`）：从 provider 集合里**筛 `listed` + 按 `overallScore` 排序自动算出来**，不是手写的。表头指标按这批 provider 的品类自动取。
- **单品测评页**（`[slug].astro`）：按文章的 `provider` 字段找到对应记录，自动渲染评分卡、App 直连矩阵、测速表、限速 note、优缺点。草稿（`draft:true`）不生成页面。
- **三篇对比/优惠码文章**（`*.mdx`）：直接 import 对应几家的 provider JSON，读 `commercial` 里的价格/链接/优惠码；日期读 `src/data/prices-meta.json`。**表格里的数据从集合来，不再手写同步。**

---

## 7. 当前 provider 清单与状态（截至本文档）

| 家 | 品类 | 上榜 | 状态 |
|---|---|---|---|
| **tripcom** | esim | ✅ | **唯一真实测评**（实测于成都） |
| nxtl / toosim / yesim | esim | ✅ | 演示数据（待实测） |
| airalo / holafly / saily | esim | ❌ | 演示数据，未上榜 |
| nomad | esim | ❌ | 市场数据存根（只有商业数据，无测评） |
| expressvpn / nordvpn / surfshark / astrill / purevpn | vpn | ❌ | 市场数据存根（供 VPN 对比文用，无测评） |

**文章**：`tripcom-china-esim-review.md`（真实测评，正文未写完、description 待补）、`best-esim-for-china.md`（汇总）；三篇 MDX 对比文（eSIM 对比、优惠码、VPN 价格对比）。

---

## 8. 内容工作流

- **文章草稿**：Notion（纯文本，无富格式）→ 复制为 Markdown 贴进 GitHub 网页编辑器 → AI 协助润色英文与 frontmatter。
- **图片**：放 `public/` 下，测速截图命名 `providername-city-location-YYYY-MM-DD.jpg`；上传前用 squoosh.app 压到 300KB 以内。
- **视频**：上传 YouTube（不公开），页面用嵌入，不放仓库。
- **实测取证**：Timestamp Camera（带时间戳的照片）。

---

## 9. 常见构建失败原因（排错清单）

- **JSON 语法**：数字字段填 null（应填 0 或省略）、删行后留下多余逗号、该填字符串的地方填了对象、URL 前缀重复——都会导致构建失败。改 JSON 后可以本地 `python3 -c "import json;json.load(open('文件'))"` 验一下。
- **质检网报红**：按第 5 节的中文报错信息对症改（多半是评分键名、reviewSlug、provider 引用、category 之一）。
- **半成品中间态**：互相依赖的改动没一起提交（如加了字段没改 schema）。

---

## 10. 已完成 / 待办 / 主动跳过

### ✅ 已完成的结构改造（"会翻车、会赚钱出错"的硬骨头都啃完了）

- **Phase 0｜构建质检网**：三条跨文件校验上线（见第 5 节）。
- **Phase 1｜评分插卡式**：metrics.ts 改成品类→指标集；eSIM 行为零变化，VPN 留空占位。
- **Phase 2｜合并账本**：商业数据搬进各家 `commercial`；`affiliates.ts`、三篇 MDX 全部改读集合；`data/providers.json` 已删除。**"两账本"病根根治。**
- **单一数据源**：每家信息集中在一个文件（灵魂已达成）。
- **首页派生**：排行榜一直是从集合算的（Phase 4-A 本就成立）。

### ⬜ 待办（按优先级，都不是欠债，是"等时机的项"）

1. **Trip.com 测评收尾**（内容，优先）：
   - 文章正文写完（App access / Speed 两节、结尾"适用人群"目前是占位）。
   - 补 `description`（文章 frontmatter 现在是空字符串 —— 影响 Google 搜索结果里的描述文字和结构化数据）。
2. **实测更多 eSIM**（内容，趁在中国的窗口期）：把 nxtl/toosim/yesim 等演示数据换成真实实测数据。数据结构现在很干净，换一家 = 改它一个文件（填真实 scores、appAccess、speedTests、pros/cons，把 `sampleData` 设 false）。
3. **Phase 3｜VPN 成为一等品类**（等你真去测 VPN 再启动）：
   - 在 metrics.ts 填 `vpn` 指标集（空占位现成）。
   - 把某家 VPN 存根补上实测数据、写文章、`listed` 打开。
   - 存根记录已经建好，届时直接往里填即可。
4. **评测/身份分区块**（低回报整洁活）：目前评测字段和身份字段平铺在记录顶层，可收进 `review:{}`、`identity:{}` 区块。**最自然的时机是做 Phase 3 时顺手规整**，别单独为整洁改一遍。
5. **Phase 4-B｜文章表格结构也自动派生**（低回报整洁活）：三篇 MDX 里"列出哪几家、每家哪些规格"目前手写。数据已从集合来，但结构还手写。规格一年变不了几次，手写够用；等某天觉得来回改烦了，再把最常变的字段抽进数据。

### 🚫 主动决定不做（不是遗漏）

- **按品类分文件夹**（esim/、vpn/…）：Phase 1 加了 `category` 字段后，品类靠字段区分即可，不需要靠文件夹。而且 `en/` 是**语言**文件夹，配合未来双语规划；按品类分反而和双语路线冲突。所以所有 provider 都放在 `content/providers/en/`，靠 `category` 字段区分品类。

---

## 11. 给未来 AI 助手的提示

- **改数据前先看这份文档 + `content.config.ts`**，别假设旧记忆还成立（这个项目结构改过好几轮）。
- **单一数据源是底线**：不要为任何数据再造"第二个账本"。
- **质检网是朋友**：它报红是在帮你拦 bug，不要为了让构建通过而绕过或削弱校验；应该去修数据。
- **小步 + 每步验证**：改动尽量拆小，每步用 `npm run build` 确认，能逐字节比对页面输出就比对（这是这个项目一路没翻车的关键纪律）。
- **互相依赖的改动放同一次提交。**
- **内容 > 结构**：结构层面的硬骨头已经啃完，别再过度优化结构；优先推动内容（实测、收尾文章）。
