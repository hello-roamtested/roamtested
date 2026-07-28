# RoamTested 操作手册（中文）

面向日常维护的实操指南。**想了解项目架构和背景，看 [`PROJECT.md`](./PROJECT.md)；这份只讲"某件事具体怎么做"。**

大部分操作都能在 **GitHub 网页端**完成（点文件 → 铅笔编辑 / 新建 / 删除 → 提交），提交后 Cloudflare 自动构建部署。

---

## 目录

- [跑起来 / 部署](#跑起来--部署)
- [任务：改某家的联盟链接](#任务改某家的联盟链接)
- [任务：改价格 / 优惠码](#任务改价格--优惠码)
- [任务：把演示数据换成真实实测数据](#任务把演示数据换成真实实测数据)
- [任务：新增一家 provider](#任务新增一家-provider)
- [任务：新增一篇测评文章](#任务新增一篇测评文章)
- [任务：让某家上榜 / 下榜](#任务让某家上榜--下榜)
- [任务：加一个新品类（如随身 WiFi）](#任务加一个新品类如随身-wifi)
- [任务：跑价格监控](#任务跑价格监控)
- [质检网会拦你什么（报错怎么读）](#质检网会拦你什么报错怎么读)
- [三条铁律](#三条铁律)

---

## 跑起来 / 部署

**本地（有 Node 环境时）：**
```bash
npm install
npm run dev      # 本地预览，改文件实时刷新
npm run build    # 构建；报错就是哪里有问题，绿了才安全
```

**部署：** 向主分支提交 = Cloudflare 自动构建。**最新提交旁的绿勾 = 已上线。** 构建失败不影响线上（保留上一版），所以不用怕。

---

## 任务：改某家的联盟链接

改一个地方就够，全站自动跟上（评测页按钮、首页排行榜、对比文里的链接）。

打开 `src/content/providers/en/<家名>.json`，改 `commercial.affiliate_url`：
```json
"commercial": {
  "affiliate_url": "https://……你的新链接……",
  ...
}
```
> 换联盟 ID 只改一处；子追踪标签（affS、sid、trip_sub1 等）可随便加，不影响归因。

---

## 任务：改价格 / 优惠码

同样在 `src/content/providers/en/<家名>.json` 的 `commercial` 里改（价格字段各家不一，键名沿用现有的，如 `china_2d_500mb`、`monthly`、`promo_code`）。三篇对比/优惠码文章会自动读到。

---

## 任务：把演示数据换成真实实测数据

以某家现在是"演示数据"的 eSIM 为例，实测回来后打开它的 `src/content/providers/en/<家名>.json`：

1. 把 `"sampleData": true` 改成 `false`（黄色"演示数据"横幅消失）。
2. 填真实的 `scores`（键必须正好是这家品类的指标，见下方质检网说明）：eSIM 是 `appAccess / speed / price / activation / usability`，每项 0–10。
3. 填 `appAccess`（App 直连矩阵）、`speedTests`（测速记录）、`pros` / `cons`、`verdict`、`price.headline`、`exitCountry`、`throttleAfterCap`。
4. 如果配了测评文章，设 `reviewSlug` 指向文章 slug。

> 只改这一个文件，评测页、评分卡、首页排名全自动更新。

---

## 任务：新增一家 provider

在 `src/content/providers/en/` 新建 `<家名>.json`。

**只想先占个位（有联盟链接/价格，还没测评）——"市场数据存根"：**
```json
{
  "name": "显示名",
  "category": "vpn",           // eSIM 可省略(默认 esim)
  "listed": false,             // 存根必须 false,否则会跑上排行榜
  "commercial": {
    "affiliate_url": "https://……",
    "monthly": 9.99
  }
}
```

**要带完整测评：** 在上面基础上补 `verdict`、`price.headline`、`scores`（键要对上该品类指标）、`appAccess`、`speedTests`、`pros`、`cons`，并把 `listed` 设为想要的值。

> 加新家后，如果它属于某个还没定义指标的品类（如现在的 VPN），评分校验会自动跳过；一旦该品类填了指标，就要求 scores 对齐。

---

## 任务：新增一篇测评文章

1. 在 `src/content/posts/en/` 新建 `<slug>.md`，frontmatter：
```yaml
---
title: "文章标题"
description: "一句话描述(会进 Google 搜索结果和结构化数据,别留空)"
lang: en
date: "2026-07-28"
kind: review
provider: "en/<对应的家名>"    # 必须指向真实存在的 provider 文件
draft: false                   # true = 不生成页面
---
```
2. 正文写叙述即可——评分卡、App 矩阵、测速表、优缺点由模板从对应 provider 记录自动渲染，**不用在正文里手写这些**。
3. 回到那家的 provider JSON，把 `reviewSlug` 设成这篇文章的 slug（这样首页排行榜里它的名字能点进测评）。

> `provider` 指错、或 `reviewSlug` 指向不存在的文章，构建会当场报红——放心大胆改。

---

## 任务：让某家上榜 / 下榜

改那家 provider JSON 的 `"listed"`：`true` 上首页排行榜，`false` 下榜。
（`listedSpeedTests` 同理控制是否上测速库页面。）

> 注意：`listed: true` 的真实服务商**必须有 scores**，否则构建报红（排行榜没法显示没分数的家）。

---

## 任务：加一个新品类（如随身 WiFi）

两步，不改模板、不改结构：

1. 在 `src/config/metrics.ts` 的 `METRICS_BY_CATEGORY` 里登记一行，照 eSIM 的格式写这个品类的指标（权重合计 100）：
```ts
'pocket-wifi': [
  { id: 'battery', label: '...', short: '...', weight: 25, blurb: '...' },
  // ...合计 100
],
```
2. 该品类的 provider 文件里 `"category": "pocket-wifi"`。

评分卡、对比表、质检网会自动认这个新品类。

---

## 任务：跑价格监控

脚本在 `scripts/price-watch/`，独立运行，**不碰网站数据**——它只抓价、和 `baseline.json` 比对，把变化写进 `report.md`（工作流据此开 GitHub Issue 提醒你）。看到提醒后，**由你手动**去对应 provider 的 `commercial` 里更新价格。

```bash
node scripts/price-watch/check-prices.mjs
```
要监控哪些页面/套餐，配置在 `scripts/price-watch/watchlist.json`。

---

## 质检网会拦你什么（报错怎么读）

`content.config.ts` 里有一套构建时校验。改数据后如果构建报红，多半是撞到下面某条（报错是中文的，直接照着改）：

| 报错关键词 | 意思 | 怎么修 |
|---|---|---|
| 未知品类 | category 拼错了 | 改成 metrics.ts 里登记过的品类名 |
| 未知评分指标 / 缺少评分指标 | scores 的键和该品类指标对不上 | 键改成该品类的指标 id，不多不少 |
| 上榜服务商必须有 scores | listed:true 但没填分 | 要么补 scores，要么设 listed:false |
| reviewSlug 指向的文章不存在 | 指向了不存在/已删的文章 | 改对，或删掉这个字段 |
| provider 指向的服务商不存在 | 文章的 provider 名不对 | 改成真实存在的 provider 文件名 |

> 这些报红是**好事**——它在上线前替你拦住了 bug。别绕过校验，去修数据。

---

## 三条铁律

1. **一个事实只存一个地方。** 联盟链接、价格只在那家的 `commercial` 里。不要为同类数据再造第二个文件。
2. **互相依赖的改动放同一次提交。** 比如"删字段"和"改 schema"必须一起提交，否则中间态构建失败。
3. **构建失败不用慌。** 线上还是上一版好的，绿勾了才算上线。改 JSON 拿不准，先本地 `python3 -c "import json;json.load(open('文件'))"` 验一下语法。
