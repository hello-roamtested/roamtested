import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import fs from 'node:fs';
import { metricsFor, CATEGORIES } from './config/metrics';

// 【构建时点名·自动扫描版】递归扫描整个目录树,不写死任何子文件夹。
// 以后按品类重排(esim/、vpn/、pocket-wifi/ ...)后无需回来改这里,新板块自动纳入检查。
function scanFiles(dir: string, extRe: RegExp): string[] {
  return fs
    .readdirSync(dir, { recursive: true })
    .map((p) => String(p).split('\\').join('/')) // 归一化路径分隔符(兼容 Windows)
    .filter((p) => extRe.test(p))
    .map((p) => p.replace(extRe, ''));
}
// provider 的 id 含文件夹前缀,与文章里 provider: "en/xxx" 的写法保持一致
const PROVIDER_IDS = new Set(scanFiles('src/content/providers', /\.json$/));
// reviewSlug 存的是纯 slug(不含文件夹),所以只取 basename(最后一段)
const POST_SLUGS = new Set(
  scanFiles('src/content/posts', /\.mdx?$/).map((p) => p.split('/').pop()!)
);

/**
 * providers 集合:每个 eSIM 服务商一个 JSON 文件,存所有结构化数据
 * (评分、价格、限速政策、App 直连矩阵、测速记录、联盟链接)。
 * posts 集合:每篇文章一个 Markdown 文件,正文写叙述,
 * 数据部分由页面模板从 providers 自动拉取渲染。
 */

const providers = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/providers' }),
  schema: z.object({
    name: z.string(),
    lang: z.string().default('en'),
    // 品类:决定用哪套评分指标(见 src/config/metrics.ts)。默认 esim,现有 eSIM 文件无需改。
    category: z.string().default('esim'),
    // ⚠ 样例数据开关:true 时页面上会显示黄色"演示数据"横幅。
    // 换成你的实测数据后,把它改成 false 或删掉这一行。
    sampleData: z.boolean().default(false),
    // 是否进入首页对比表
    listed: z.boolean().default(true),
    // 是否进入 Speed Tests 页面(默认显示;设 false 可隐藏某家)
    listedSpeedTests: z.boolean().default(true),
    verdict: z.string().optional(), // 一句话结论(测评用);只有市场数据的存根可省略
    // 联盟链接现在存在下面的 commercial.affiliate_url 里,
    // 由 src/config/affiliates.ts 的 affiliateUrlFor() 解析。
    // 对应完整测评文章的 slug(posts 里的文件名),没有就留空
    reviewSlug: z.string().optional(),
    price: z
      .object({
        headline: z.string(), // 表格里显示的价格,如 "$9.50 · 5GB · 30 days"
      })
      .optional(), // 只有市场数据的存根可省略
    // ── 商业数据(联盟链接 / 价格 / 优惠码)────────────────────────────
    // 每家 provider 的商业数据统一存这里,是全站唯一来源。
    // affiliate_url 单独命名(联盟链接是核心);其余商业字段各家不一,用 catchall
    // 原样容纳(键名沿用现有,如 china_2d_500mb / promo_code / referral_amount)。
    commercial: z
      .object({
        affiliate_url: z.string().url().optional(),
        // 同品牌多产品:每个产品一条联盟链接(如 china / asia_pacific)。
        // 用 <Aff product="asia_pacific"> 或 affiliateUrlFor(provider, 'asia_pacific') 取。
        products: z
          .record(z.string(), z.object({ affiliate_url: z.string().url() }))
          .optional(),
      })
      .catchall(z.any())
      .optional(),
    // 分数 0–10,键名对应 src/config/metrics.ts 里的指标 id。只有市场数据的存根可省略。
    scores: z.record(z.string(), z.number()).optional(),
    throttlePolicy: z
      .object({
        dailyCap: z.string(), // e.g. "3 GB/day high-speed"
        afterCap: z.string(), // e.g. "throttled to 1 Mbps"
        published: z.boolean(), // 官方是否公开政策
      })
      .optional(),
    // App 直连实测矩阵
    appAccess: z
      .array(
        z.object({
          app: z.string(),
          works: z.boolean(),
          notes: z.string().optional(),
        })
      )
      .optional(),
    // 数据出口国家(IP 检测结果),影响延迟与直连
    exitCountry: z.string().optional(),
    // 套餐高速流量用完后的限速
    throttleAfterCap: z.string().optional(),
    // 实测速度记录,可无限追加
    speedTests: z
      .array(
        z.object({
          city: z.string(),
          spot: z.string(), // e.g. "Chunxi Road, outdoors"
          network: z.string(), // e.g. "China Unicom 5G"
          downMbps: z.number(),
          upMbps: z.number(),
          pingMs: z.number().optional(),
          hotspot: z.string().optional(),
          date: z.string(), // YYYY-MM-DD
          // 截图文件名,放在 public/images/speedtests/ 下
          screenshot: z.string().optional(),
        })
      )
      .optional(),
    pros: z.array(z.string()).default([]),
    cons: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    // 【跨文件校验1】reviewSlug 必须指向真实存在的文章。
    // 演示数据也查:悬空指针(指向已删文章)在任何时候都是 bug。
    if (data.reviewSlug && !POST_SLUGS.has(data.reviewSlug)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reviewSlug'],
        message: `reviewSlug 指向的文章 "${data.reviewSlug}" 不存在(src/content/posts/en/ 下没有这个文件)`,
      });
    }
    // 【跨文件校验0】category 必须是 metrics.ts 里登记过的品类。
    if (!CATEGORIES.includes(data.category)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['category'],
        message: `未知品类 "${data.category}"。已登记的品类:${CATEGORIES.join(', ')}(在 src/config/metrics.ts 里登记新品类)`,
      });
      return; // 品类都不对,后面按品类取指标就没意义了
    }
    // 【跨文件校验2】评分键名:演示数据(sampleData=true)放行——反正实测后要整条重写,先放行。
    // 只对真实数据强制:scores 的键必须正好等于【该品类】的指标集,不多不少。
    if (data.sampleData) return;
    const ids = metricsFor(data.category).map((m) => m.id);
    // 该品类还没定义指标集(如 VPN 占位)→ 暂无评分标准可对,跳过校验。
    if (ids.length === 0) return;
    const keys = Object.keys(data.scores ?? {});
    // 市场数据存根(完全没有 scores)→ 跳过评分校验;
    // 但上榜的真实服务商(listed:true)必须有评分,否则排行榜没法显示分数。
    if (keys.length === 0) {
      if (data.listed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scores'],
          message: `上榜服务商(listed:true)必须有 scores;若这是只有市场数据的存根,请设 listed:false`,
        });
      }
      return;
    }
    for (const key of keys) {
      if (!ids.includes(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scores', key],
          message: `未知评分指标 "${key}"。品类 "${data.category}" 只允许:${ids.join(', ')}(见 src/config/metrics.ts)`,
        });
      }
    }
    for (const id of ids) {
      if (!keys.includes(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scores'],
          message: `缺少评分指标 "${id}"。真实数据必须包含全部指标:${ids.join(', ')}`,
        });
      }
    }
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: z.string().default('en'),
    date: z.string(), // YYYY-MM-DD,发布日期
    updated: z.string().optional(),
    kind: z.enum(['review', 'roundup', 'guide']).default('guide'),
    // review 类型文章填对应 provider 的文件名(不带 .json)
    provider: z.string().optional(),
    intro: z.string().optional(), 
    draft: z.boolean().default(false)
  })
  .superRefine((data, ctx) => {
    // 【跨文件校验3】review 文章的 provider 必须指向真实存在的服务商。
    // 防的正是 trip-com/tripcom 那种命名对不上、或指向已删服务商的情况。
    if (data.provider && !PROVIDER_IDS.has(data.provider)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['provider'],
        message: `provider 指向的服务商 "${data.provider}" 不存在(src/content/providers/ 下没有对应文件)`,
      });
    }
  }),
});

export const collections = { providers, posts };
