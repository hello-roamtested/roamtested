# RoamTested 项目全档案（PROJECT.md）

> **本文件的用途**：这是 roamtested.com 的完整项目记忆。开新的 AI 对话时，把本文件内容发给 AI（或让它读这个文件），它就能立即接上全部上下文。每次完成大改动后，让 AI 顺手更新本文件。
>
> 最后更新：2026-07-17

---

## 1. 项目是什么

**RoamTested（roamtested.com）**：面向全球数字游民的科技工具类测评网站，英文内容，比如vpn e-sim ai工具等。目前专注于去中国旅行的外国游客的英文评测站，核心定位是"人在中国实地测试 eSIM vpn"（真金购买、实测速度、逐 App 防火墙直连检查、透明评分）——差异化在"tested on the ground"，对抗纯攒稿的竞品站。

**商业模式**：联盟营销（affiliate）。读者通过站内链接购买 eSIM/VPN，站长赚佣金。

**内容主线**：中国 eSIM 评测与排名（核心利基）→ 全球 eSIM 对比、优惠码、VPN 对比（流量外围）。

**语言**：英文（面向国际游客）。中文版结构已预留未启用。

---

## 2. 技术栈与账号资产

| 资产 | 详情 |
|---|---|
| 代码仓库 | GitHub `hello-roamtested/roamtested`（私有）|
| 框架 | Astro ^5.2.0 + @astrojs/mdx ^4.2.0 + @astrojs/sitemap，纯静态输出 |
| 托管 | Cloudflare Pages，连接 GitHub 仓库自动构建。Build command: `npm run build`，输出目录 `dist` |
| 域名 | roamtested.com（Cloudflare 管理）|
| 收录 | Google Search Console 已验证；sitemap 位于 `/sitemap-index.xml` 已提交 |
| robots | `public/robots.txt`（allow all + sitemap 声明）。Cloudflare 层：AI 爬虫**放行**（Do not block），robots 策略用 **Content Signals Policy**（search=yes, ai-train=no）|
| 分析 | ⚠️ 尚未安装任何统计（GA4/Plausible 待装）| 
<!-- 是网站访客统计工具——记录"每天多少人来、看了哪些页面、从哪里来的（谷歌？Reddit？AI 推荐？）、停留多久"。对联盟站来说，"哪篇文章带来了联盟点击"是最核心的运营数据，没有统计工具就是盲飞。
两个主流选择：
GA4（Google Analytics 4）：谷歌官方，免费，功能最全，但界面复杂、学习成本高
Plausible：第三方极简统计，一眼能看懂，无 Cookie 弹窗烦恼，缺点是付费（约 $9/月） 
开始有内容发布节奏之后，正式引流之后再安装 -->
| 注意 | 仓库里**没有** package-lock.json（曾因 lock 不同步导致构建失败而删除；以后本地有 Node 环境时可重新生成提交）|

---

## 3. 目录结构（带作用注释）

```
├── .github/workflows/price-watch.yml   # 价格监控定时任务（见第5节）
├── README.zh.md                        # 日常操作手册 中文（发评测、改数据、改指标）★必读
├── astro.config.mjs                    # 站点配置：域名、mdx+sitemap 插件、i18n(en，zh预留)
├── package.json                        # 依赖清单
├── public/robots.txt
├── scripts/price-watch/                # 价格&优惠监控系统
│   ├── check-prices.mjs                # 监控脚本（无依赖，Node 自带能力）
│   ├── watchlist.json                  # 监控清单：16个目标（11价格+5优惠信号）
│   └── baseline.json                   # 价格基线（脚本自动维护）
└── src/
    ├── config/
    │   ├── site.ts                     # 品牌名、口号、邮箱、导航菜单
    │   └── metrics.ts                  # ★评分体系唯一来源：5指标+权重（见第6节）
    ├── content.config.ts               # content collections 的 schema 定义
    ├── content/
    │   ├── providers/en/*.json         # ★实测数据：每个eSIM一个JSON（评分/测速/App矩阵/联盟链接）
    │   │                               #   现有: airalo, holafly, saily（均为演示数据 sampleData:true）
    │   └── posts/en/*.md               # ★评测文章正文（叙述部分），数据由模板自动渲染
    │       ├── airalo-china-esim-review.md   (kind: review, 关联 provider en/airalo)
    │       └── best-esim-for-china.md        (kind: roundup, 自动插入全量对比表)
    ├── data/
    │   └── providers.json              # ★市场数据唯一来源：5家eSIM+5家VPN的价格/优惠码（见第4节）
    ├── layouts/
    │   ├── Base.astro                  # 全站布局：导航/页脚/联盟披露
    │   └── ArticleLayout.astro         # MDX文章布局（包 Base + prose 样式）
    ├── components/                     # 评测页组件：ComparisonTable, ScoreCard, AppAccessMatrix,
    │                                   # SpeedTable, ThrottleCard, ProsCons, SampleBanner, AffiliateButton
    ├── styles/global.css               # 配色字体变量在顶部
    └── pages/
        ├── index.astro                 # 首页：中国eSIM排名表（读 providers 集合）
        ├── [slug].astro                # 动态路由：渲染 posts 集合的所有文章
        ├── reviews/index.astro         # 评测列表页
        ├── guides/index.astro          # 攻略列表页：手动登记的MDX攻略 + 自动收录 kind:guide 文章     
        ├── about.astro                 # About+评测方法论（作者介绍是占位符待填）
        ├── affiliate-disclosure.astro / privacy.astro / 404.astro
        ├── travel-esim-comparison.mdx  # 全球eSIM对比（数据驱动，读 data/providers.json）
        ├── esim-promo-codes.mdx        # eSIM新人优惠码（数据驱动）
        └── vpn-for-china.mdx           # VPN价格对比（数据驱动）
```

---

## 4. 两套数据系统（重要，勿混淆）

**系统A：实测数据（content collections）** —— 站的灵魂
- 位置：`src/content/providers/en/*.json` + `src/content/posts/en/*.md`
- 内容：自己实测的评分、测速记录、App直连矩阵、限速政策、优缺点、**联盟链接（affiliateUrl）**
- 渲染：`[slug].astro` 自动把数据组件（评分卡/测速表/矩阵）插进文章
- 发新评测的流程见 README.zh.md：复制 provider JSON + 复制文章 md，两步完成

**系统B：市场数据（src/data/providers.json）** —— 对比类文章的数据源
- 内容：5家eSIM（airalo/nomad/yesim/toosim/nxtl）+ 5家VPN（expressvpn/nordvpn/surfshark/astrill/purevpn）的官方价格、优惠码、折扣比例、试用信息 + `meta.last_verified` 日期
- 被引用：三篇 MDX 文章（travel-esim-comparison / esim-promo-codes / vpn-for-china）通过 `import data from '../data/providers.json'` + `{data.xxx}` 引用；单GB成本等由表达式实时计算
- **与监控系统闭环**：字段名与 `scripts/price-watch/watchlist.json` 的监控目标对应

**数据流转图**：
```
官方定价页 →(每周一自动抓取)→ price-watch 脚本 →(发现变化)→ GitHub Issue + 邮件
    → 人工核实 → 改 src/data/providers.json 一处 → 全部对比文章自动更新
实地测试 → 人工填 content/providers/en/*.json → 评测页/首页排名自动更新
```

---

## 5. 价格监控系统（price-watch）

- **触发**：每周一北京时间 09:00 自动跑（cron `0 1 * * 1`），也可在 Actions 页手动 Run workflow
- **监控对象**（watchlist.json，16项）：Airalo 中国起步价/Unlimited 3天/30天、Nomad 中国起步价/1GB/20GB、TooSim 中国 1GB/20GB、Yesim 中国起步价、NXTL 美英每GB费率；优惠类：Airalo 首单折扣%/推荐奖励、Nomad 免费试用GB/目的地数、NXTL 推荐奖励、Yesim 折扣页
- **机制**：抓官方页面 → 正则提取（标题优先，文本次之）→ 与 baseline 比对。无变化=静默更新核实日期；正常变价=更新基线+开Issue；波动>50%=疑似解析错误，不动基线只报警；提取失败=报警提示页面可能改版
- **已知限制**：Yesim 页面 JS 渲染，标记 allowFailure 不报警，需每月人工看一次；NXTL 中国费率在JS计算器里抓不到
- **收到 Issue 后**：真变价→改 `src/data/providers.json` 对应字段→关Issue；疑似错误→人工开页面核实；提取失败→把页面链接发给AI更新 watchlist 正则

---

## 6. 评分体系（metrics.ts）

App access without VPN 30% · Real-world speed 25% · Activation & setup 15% · Fair-use/throttling transparency 15% · Price & value 15%。加权总分由 `overallScore()` 计算。改指标只动 metrics.ts，全站自动跟随（新增指标需给每个 provider JSON 补分）。

---

## 7. 线上页面清单

| URL | 类型 | 数据源 |
|---|---|---|
| `/` | 中国eSIM排名首页 | providers 集合 |
| `/best-esim-for-china/` | roundup 文章 | posts + providers 集合 |
| `/airalo-china-esim-review/` | review 文章 | posts + airalo.json |
| `/reviews/` | 评测列表 | posts 集合 |
| `/guides/` | 攻略列表 | 页内手动清单 + posts 集合(kind:guide) |
| `/travel-esim-comparison/` | 全球对比（MDX） | data/providers.json |
| `/esim-promo-codes/` | 优惠码指南（MDX） | data/providers.json |
| `/vpn-for-china/` | VPN对比（MDX） | data/providers.json |
| `/about/` `/affiliate-disclosure/` `/privacy/` | 静态页 | — |

内链结构：三篇MDX互链 + 均链向 `/best-esim-for-china/`；优惠码⇄全球对比双向。

---

## 8. 已做决策及原因（Decision Log）

1. **AI 爬虫全放行 + Content Signals 声明禁训练**（Cloudflare AI Crawl Control: Do not block；robots 用 Content Signals Policy）。原因：新站最缺曝光，AI 搜索（ChatGPT/Perplexity）引用是重要流量源；用 signals 保留版权立场。
2. **市场数据单一数据源**：价格/优惠码只存 data/providers.json，文章用引用。原因：变价只改一处、与监控闭环、杜绝多处不一致。
3. **中国对比内容不单独发页面**：与已有 `/best-esim-for-china/` 主题重复会互抢排名（keyword cannibalization），素材保留待合并进现有页。
4. **删除 package-lock.json**：Cloudflare 构建因 lock 与 package.json 不同步失败；删除后用 npm install。属临时方案，后续本地重新生成。
5. **监控不自动改网站数据，只开 Issue**：人工审核一道，防解析错误污染线上内容。Issue 带 `price-watch` 标签（标签需在仓库先创建，否则开Issue会失败——已创建）。
6. **URL 不含年份**（如 /esim-promo-codes/），年份放标题。原因：逐年更新内容不用改地址、不丢外链。
7. **优惠码文章引导读者去官方码页核实**：第三方码过期率高，保护站点信誉。
8. **TooSim 中国定价异常贵**（$13.99/1GB，为 Nomad 3倍+），文章如实差评——诚实评测是站点定位的根基。
9. **联盟策略**：对决文选题="热门大牌 vs 有联盟链接的品牌"；先内容占排名后补链接；冷门vs冷门不做。
10. **文章正文只把"会变的值"做成JSON引用**（价格/码/比例/日期），一次性描述硬编码，避免过度工程化。

---

## 9. 当前状态与待办（按优先级）

**已完成**：技术基建全套（GSC/sitemap/robots/监控）、3篇MDX对比文上线且数据驱动、README手册、评分体系、构建管线正常。

**待办**：
1. ⚠️ **首页仍是演示数据**：airalo/holafly/saily 三个 JSON 均 `sampleData: true`，页面挂黄色 Demo 横幅。需填入真实实测数据后改 false。这是对 SEO/信任伤害最大的一项。
2. ⚠️ **联盟链接全是占位符**：provider JSON 里 `affiliateUrl` 均为 REPLACE-WITH-xxx；三篇MDX里购买链接指向官方站。联盟批准后替换。
3. About 页作者介绍是占位符；建议补作者署名+方法论展开（E-E-A-T）。
4. 未装网站统计（GA4 或 Plausible）。
5. 中国对比素材合并进 `/best-esim-for-china/`。
6. GSC 对三篇新文章手动 Request Indexing（可选加速）。
7. 内容队列建议：Nomad China 评测 → Airalo vs Nomad China 对决 → Yesim 评测 →“Do you need a VPN in China if you have an eSIM?”（eSIM+VPN 双联盟转化文）。
8. 每月1号人工核对优惠码有效性 + Yesim 价格；每季度过一遍全部价格。
9. 小瑕疵：JSON 数字尾零被吃（$12.50→$12.5），介意可用 `.toFixed(2)`。

**业务状态（待站长补充）**：
- 联盟计划申请进度：Trip.com Affiliate 申请中；其余（Airalo/Nomad/Yesim/NXTL/Astrill…）状态待记录
- 实测进度：Airalo 中国实测状态待确认；下一个实测对象待定

---

## 10. 日常操作速查

- **发布单品评测**：见 README.zh.md 第1节（复制 provider JSON + 复制文章 md）
- **响应价格监控 Issue**：见本文第5节
- **改市场价格/优惠码**：只改 `src/data/providers.json`，顺手更新 `meta.last_verified`
- **改评分指标**：只改 `src/config/metrics.ts`
- **所有上传均可网页端完成**：GitHub → Add file / 铅笔编辑 → Commit → Cloudflare Pages 自动构建（1-3分钟）→ 构建失败看 Cloudflare Dashboard 的 Build log 最后20行
- **构建失败不影响线上**：Pages 保留上一次成功版本
