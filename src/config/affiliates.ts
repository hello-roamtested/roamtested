/**
 * ═══════════════════════════════════════════════════════════════════
 *  联盟链接的唯一解析入口(THE AFFILIATE LINK RESOLVER)
 *
 *  全站所有"购买/查价"按钮的链接都从这里取,不在别处手写。
 *  链接现在存放在每家 provider 记录自己的 commercial.affiliate_url 里
 *  (src/content/providers/.../*.json)。换联盟 ID / 子追踪标签时,
 *  只改那家记录的这一处即可。
 * ═══════════════════════════════════════════════════════════════════
 */

/**
 * 从 provider 集合条目解析它的联盟链接。
 * 该家没填 commercial.affiliate_url 时返回 '#'(说明漏填了)。
 */
export function affiliateUrlFor(provider: {
  data: { commercial?: { affiliate_url?: string } };
}): string {
  return provider.data.commercial?.affiliate_url ?? '#';
}
