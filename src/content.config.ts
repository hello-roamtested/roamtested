import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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
    // ⚠ 样例数据开关:true 时页面上会显示黄色"演示数据"横幅。
    // 换成你的实测数据后,把它改成 false 或删掉这一行。
    sampleData: z.boolean().default(false),
    // 是否进入首页对比表
    listed: z.boolean().default(true),
    verdict: z.string(), // 一句话结论,如 "Best overall for multi-city trips"
    affiliateUrl: z.string().url(),
    // 对应完整测评文章的 slug(posts 里的文件名),没有就留空
    reviewSlug: z.string().optional(),
    price: z.object({
      headline: z.string(), // 表格里显示的价格,如 "$9.50 · 5GB · 30 days"
      perGB: z.number().optional(), // 每 GB 美元成本,用于排序比较
    }),
    // 分数 0–10,键名对应 src/config/metrics.ts 里的指标 id
    scores: z.record(z.string(), z.number()),
    throttlePolicy: z
      .object({
        dailyCap: z.string(), // e.g. "3 GB/day high-speed"
        afterCap: z.string(), // e.g. "throttled to 1 Mbps"
        published: z.boolean(), // 官方是否公开政策
        notes: z.string().optional(),
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
    // 实测速度记录,可无限追加
    speedTests: z
      .array(
        z.object({
          city: z.string(),
          spot: z.string(), // e.g. "Chunxi Road, outdoors"
          network: z.string(), // e.g. "China Unicom 5G"
          downMbps: z.number(),
          upMbps: z.number(),
          pingMs: z.number(),
          date: z.string(), // YYYY-MM-DD
        })
      )
      .optional(),
    pros: z.array(z.string()).default([]),
    cons: z.array(z.string()).default([]),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: z.string().default('en'),
    date: z.string(), // YYYY-MM-DD,发布日期
    updated: z.string().optional(),
    kind: z.enum(['review', 'roundup', 'guide']).default('guide'),
    // 主题标记：文章属于哪个测评品类。暂无页面使用，为将来开品类栏目留的坑。
    topic: z.enum(['esim', 'vpn', 'travel-tech']).default('esim'),
    // review 类型文章填对应 provider 的文件名(不带 .json)
    provider: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { providers, posts };
