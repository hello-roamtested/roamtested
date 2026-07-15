/**
 * ═══════════════════════════════════════════════════════════════════
 *  评测指标配置(THE METRICS CONFIG)
 *  这是全站评分体系的唯一来源。增加/删除/修改指标只需要改这个文件,
 *  首页对比表、单品评分卡会自动跟着变。
 *
 *  每个指标的字段:
 *    id     — 内部名称。provider 数据文件里的 scores 用同样的 id 打分
 *    label  — 完整名称(评分卡里显示)
 *    short  — 短名称(对比表表头显示)
 *    weight — 权重,所有指标加起来应等于 100
 *    blurb  — 一句话解释,鼠标悬停/评分卡里显示
 *
 *  ⚠ 增加指标后,记得给 src/content/providers/ 里每个 JSON 文件的
 *    scores 对象补上对应的分数(0–10)。删除指标则无需动 JSON,
 *    多余的分数会被忽略。
 * ═══════════════════════════════════════════════════════════════════
 */

export interface Metric {
  id: string;
  label: string;
  short: string;
  weight: number;
  blurb: string;
}

export const METRICS: Metric[] = [
  {
    id: 'appAccess',
    label: 'App access without a VPN',
    short: 'Apps',
    weight: 30,
    blurb: 'Does Google, WhatsApp, Instagram and co. load out of the box? Tested app by app, on the ground.',
  },
  {
    id: 'activation',
    label: 'Activation & setup',
    short: 'Setup',
    weight: 15,
    blurb: 'How painless is install and activation — QR delivery, clear steps, time until first byte.',
  },
  {
    id: 'throttling',
    label: 'Fair-use & throttling transparency',
    short: 'Fair use',
    weight: 15,
    blurb: 'What "unlimited" really means: the daily high-speed cap, the throttled speed, and whether the policy is published.',
  },
  {
    id: 'speed',
    label: 'Real-world speed',
    short: 'Speed',
    weight: 25,
    blurb: 'Download, upload and latency measured on location in China — not the number on the box.',
  },
  {
    id: 'price',
    label: 'Price & value',
    short: 'Price',
    weight: 15,
    blurb: 'Cost per GB, top-up flexibility, and whether the price matches what you actually get.',
  },
];

/** Weighted overall score (0–10, one decimal) from a provider's scores object. */
export function overallScore(scores: Record<string, number>): number {
  let total = 0;
  let weightSum = 0;
  for (const m of METRICS) {
    const s = scores[m.id];
    if (typeof s === 'number') {
      total += s * m.weight;
      weightSum += m.weight;
    }
  }
  if (weightSum === 0) return 0;
  return Math.round((total / weightSum) * 10) / 10;
}
