// scripts/price-watch/check-prices.mjs
// 价格监控脚本：抓取 watchlist.json 里的页面，提取价格，与 baseline.json 比对。
// 无变化 → 更新 baseline 的 last_verified 日期
// 有变化 → 写入 report.md（工作流用它开 GitHub Issue）
// 提取失败 / 价格波动 >50% → 同样写入 report.md，标记"需人工检查"，不污染 baseline
//
// 无第三方依赖，Node 18+ 自带 fetch 即可运行。
// 本地测试：node scripts/price-watch/check-prices.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const WATCHLIST_PATH = join(DIR, "watchlist.json");
const BASELINE_PATH = join(DIR, "baseline.json");
const REPORT_PATH = join(DIR, "report.md");

const SUSPICIOUS_CHANGE_RATIO = 0.5; // 波动超过 ±50% 视为疑似解析错误
const FETCH_TIMEOUT_MS = 30_000;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 RoamTestedPriceWatch/1.0";

const today = new Date().toISOString().slice(0, 10);

// ---------- 工具函数 ----------

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// 去掉 HTML 标签和脚本，得到接近"页面可见文本"的字符串，空白折叠为单个空格
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

// 第一层：尝试 JSON-LD 结构化数据（schema.org 的 offers.price）
function extractFromJsonLd(html) {
  const prices = [];
  const blocks = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const [, raw] of blocks) {
    try {
      const data = JSON.parse(raw.trim());
      collectPrices(data, prices);
    } catch {
      /* 忽略无法解析的块 */
    }
  }
  return prices;
}

function collectPrices(node, out) {
  if (node == null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectPrices(item, out);
    return;
  }
  if (node.price != null && !Number.isNaN(parseFloat(node.price))) {
    out.push(parseFloat(node.price));
  }
  if (node.lowPrice != null && !Number.isNaN(parseFloat(node.lowPrice))) {
    out.push(parseFloat(node.lowPrice));
  }
  for (const value of Object.values(node)) collectPrices(value, out);
}

// 第二层：对页面文本（或标题）跑 watchlist 里配置的正则
function extractByPattern(target, html) {
  const haystack =
    target.type === "title" ? extractTitle(html) : htmlToText(html);
  // watchlist 中的正则默认对空白宽容：把模式里的 \s+ 行为交给调用方定义
  const re = new RegExp(target.pattern, "i");
  const m = haystack.match(re);
  if (m?.groups?.price) return parseFloat(m.groups.price);
  return null;
}

// ---------- 主流程 ----------

const watchlist = JSON.parse(readFileSync(WATCHLIST_PATH, "utf8"));
const baseline = existsSync(BASELINE_PATH)
  ? JSON.parse(readFileSync(BASELINE_PATH, "utf8"))
  : { prices: {} };

const results = []; // { target, status, oldPrice, newPrice, note }
const pageCache = new Map(); // 同一 URL 只抓一次

for (const target of watchlist.targets) {
  let html;
  try {
    if (!pageCache.has(target.url)) {
      pageCache.set(target.url, await fetchPage(target.url));
    }
    html = pageCache.get(target.url);
  } catch (err) {
    results.push({
      target,
      status: target.allowFailure ? "expected_failure" : "fetch_failed",
      note: `页面抓取失败：${err.message}`,
    });
    continue;
  }

  // 分层提取：正则优先（因为 watchlist 里的模式是针对具体套餐的），
  // 失败时尝试 JSON-LD 兜底（只用于报告参考，不直接采信为该套餐价格）
  let price = null;
  try {
    price = extractByPattern(target, html);
  } catch (err) {
    results.push({ target, status: "pattern_error", note: `正则错误：${err.message}` });
    continue;
  }

  if (price == null) {
    const ldPrices = extractFromJsonLd(html);
    results.push({
      target,
      status: target.allowFailure ? "expected_failure" : "parse_failed",
      note:
        ldPrices.length > 0
          ? `正则未匹配。页面结构化数据中出现的价格（供参考）：${[...new Set(ldPrices)].slice(0, 10).join(", ")}`
          : "正则未匹配，页面也没有可读的结构化价格数据。页面可能改版了。",
    });
    continue;
  }

  const prev = baseline.prices[target.id];
  if (prev == null) {
    // 首次运行：记录为基线
    baseline.prices[target.id] = price;
    results.push({ target, status: "initialized", newPrice: price });
  } else if (price === prev) {
    results.push({ target, status: "unchanged", newPrice: price });
  } else {
    const ratio = Math.abs(price - prev) / prev;
    if (ratio > SUSPICIOUS_CHANGE_RATIO) {
      // 波动过大 → 疑似解析错误，不更新基线
      results.push({
        target,
        status: "suspicious",
        oldPrice: prev,
        newPrice: price,
        note: `波动 ${(ratio * 100).toFixed(0)}%，超过 ${SUSPICIOUS_CHANGE_RATIO * 100}% 阈值，疑似页面改版导致解析错位。基线未更新，请人工核实。`,
      });
    } else {
      // 正常变价 → 更新基线并报告
      baseline.prices[target.id] = price;
      results.push({ target, status: "changed", oldPrice: prev, newPrice: price });
    }
  }
}

baseline.last_verified = today;
writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n");

// ---------- 生成报告 ----------

const changed = results.filter((r) => r.status === "changed");
const suspicious = results.filter((r) => r.status === "suspicious");
const failed = results.filter(
  (r) => r.status === "parse_failed" || r.status === "fetch_failed" || r.status === "pattern_error"
);
const needsAttention = changed.length + suspicious.length + failed.length > 0;

const lines = [];
lines.push(`# 价格监控报告 ${today}`);
lines.push("");
if (changed.length) {
  lines.push("## 价格变化（基线已自动更新，请更新网站数据和文章）");
  lines.push("");
  lines.push("| 商家 | 项目 | 旧价 | 新价 | 页面 |");
  lines.push("|---|---|---|---|---|");
  for (const r of changed) {
    lines.push(
      `| ${r.target.provider} | ${r.target.label} | $${r.oldPrice} | **$${r.newPrice}** | [查看](${r.target.url}) |`
    );
  }
  lines.push("");
}
if (suspicious.length) {
  lines.push("## 疑似解析错误（基线未更新，需人工核实）");
  lines.push("");
  for (const r of suspicious) {
    lines.push(`- **${r.target.provider} / ${r.target.label}**：$${r.oldPrice} → $${r.newPrice}。${r.note}（[页面](${r.target.url})）`);
  }
  lines.push("");
}
if (failed.length) {
  lines.push("## 提取失败（需人工检查页面是否改版）");
  lines.push("");
  for (const r of failed) {
    lines.push(`- **${r.target.provider} / ${r.target.label}**：${r.note}（[页面](${r.target.url})）`);
  }
  lines.push("");
}
lines.push("## 全部结果");
lines.push("");
for (const r of results) {
  const statusLabel = {
    unchanged: "✅ 无变化",
    changed: "🔔 已变价",
    suspicious: "⚠️ 疑似错误",
    parse_failed: "❌ 提取失败",
    fetch_failed: "❌ 抓取失败",
    pattern_error: "❌ 配置错误",
    initialized: "🆕 首次记录",
    expected_failure: "⏭️ 预期失败（JS页面）",
  }[r.status];
  const priceStr = r.newPrice != null ? ` $${r.newPrice}` : "";
  lines.push(`- ${statusLabel} — ${r.target.provider} / ${r.target.label}${priceStr}`);
}
lines.push("");
lines.push(`_核实日期：${today}_`);

writeFileSync(REPORT_PATH, lines.join("\n") + "\n");

console.log(lines.join("\n"));
// 通过退出码告诉工作流是否需要开 Issue：0=无事，78=需要注意
process.exit(needsAttention ? 78 : 0);
