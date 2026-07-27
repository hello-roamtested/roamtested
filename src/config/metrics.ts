/**
 * ═══════════════════════════════════════════════════════════════════
 *  评测指标配置(THE METRICS CONFIG)· 按品类(category)分组
 *  全站评分体系的唯一来源。每个品类一套指标;首页对比表、单品评分卡、
 *  结构化数据都会按 provider 的 category 自动取对应指标集。
 *
 *  每个指标的字段:
 *    id     — 内部名称。provider 数据文件里 scores 用同样的 id 打分
 *    label  — 完整名称(评分卡里显示)
 *    short  — 短名称(对比表表头显示)
 *    weight — 权重,同一品类内所有指标加起来应等于 100
 *    blurb  — 一句话解释
 *
 *  ── 怎么加一个新品类(如随身 WiFi / AI 工具)──────────────────
 *    1) 照着 ESIM_METRICS 的格式写一套该品类的指标数组(权重合计 100)
 *    2) 把它登记进 METRICS_BY_CATEGORY
 *    3) 该品类的 provider 文件里 category 写成这个名字
 *    评分卡、对比表、质检网会自动生效,不需要改模板或网站结构。
 * ═══════════════════════════════════════════════════════════════════
 */

export interface Metric {
  id: string;
  label: string;
  short: string;
  weight: number;
  blurb: string;
}

// ── eSIM 指标(现行)· 权重合计 100 ────────────────────────────────
const ESIM_METRICS: Metric[] = [
  {
    id: 'appAccess',
    label: 'App access without a VPN',
    short: 'Apps',
    weight: 30,
    blurb: 'Does Google, WhatsApp, Instagram, tiktok and co. load out of the box? Tested app by app, on the ground.',
  },
  {
    id: 'speed',
    label: 'Real-world speed & data policy',
    short: 'Speed',
    weight: 25,
    blurb: 'Download, upload and latency measured on location in China. Includes daily high-speed cap, throttled speed after cap, whether the fair-use policy is published, hotspot support, and network coverage.',
  },
  {
    id: 'price',
    label: 'Price',
    short: 'Price',
    weight: 25,
    blurb: 'Cost per GB, plan and top-up flexibility, and refund policy.',
  },
  {
    id: 'activation',
    label: 'Activation & setup',
    short: 'Setup',
    weight: 10,
    blurb: 'How painless is install and activation — QR delivery, clear steps, time until first byte.',
  },
  {
    id: 'usability',
    label: 'Usability',
    short: 'Usability',
    weight: 10,
    blurb: 'Device compatibility, customer support quality, and how well the provider app works day-to-day.',
  },
];

// ── VPN 指标 · 占位(PLACEHOLDER)──────────────────────────────────
// 等真正开始做 VPN 测评时再填。照着上面 ESIM_METRICS 的格式,列出 VPN 看重的维度
// (如 速度 / 隐私政策 / 流媒体解锁 / 服务器数量与分布 / 价格),权重合计 100。
// 填好后 VPN 的评分卡、对比表、质检网会自动按这套生效;在此之前留空即可——
// VPN provider 的评分校验会自动跳过(因为还没有评分标准),不会误报。
const VPN_METRICS: Metric[] = [];

/** 品类 → 指标集。加新品类在这里登记一行即可。 */
export const METRICS_BY_CATEGORY: Record<string, Metric[]> = {
  esim: ESIM_METRICS,
  vpn: VPN_METRICS,
};

/** 已登记的品类名列表(供构建时校验 provider 的 category 是否合法)。 */
export const CATEGORIES = Object.keys(METRICS_BY_CATEGORY);

/** 取某品类的指标集;未知品类回退到 eSIM(保底不崩)。 */
export function metricsFor(category: string = 'esim'): Metric[] {
  return METRICS_BY_CATEGORY[category] ?? ESIM_METRICS;
}

/** 向后兼容别名:仍指向 eSIM 指标集(about 页等旧引用继续可用)。 */
export const METRICS = ESIM_METRICS;

/** 按品类加权算总分(0–10,一位小数)。 */
export function overallScore(
  scores: Record<string, number>,
  category: string = 'esim'
): number {
  let total = 0;
  let weightSum = 0;
  for (const m of metricsFor(category)) {
    const s = scores[m.id];
    if (typeof s === 'number') {
      total += s * m.weight;
      weightSum += m.weight;
    }
  }
  if (weightSum === 0) return 0;
  return Math.round((total / weightSum) * 10) / 10;
}
