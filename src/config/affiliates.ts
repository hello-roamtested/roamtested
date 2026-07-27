/**
 * ═══════════════════════════════════════════════════════════════════
 *  联盟链接的唯一解析入口(THE AFFILIATE LINK RESOLVER)
 *
 *  全站所有"购买/查价"按钮的链接都从这里取,不在 provider JSON 里手写。
 *  真正的链接只存放在一个地方:src/data/providers.json 的 esim.<家名>.affiliate_url。
 *  换联盟 ID / 子追踪标签时,永远只改那一个文件。
 *
 *  家名(key) = provider 文件名去掉 en/ 前缀,例如
 *    src/content/providers/en/tripcom.json  →  "tripcom"
 *  必须与 data/providers.json 里 esim 的键一致。新加一家 provider,
 *  记得同时在 data/providers.json 的 esim 里建同名条目并填 affiliate_url。
 * ═══════════════════════════════════════════════════════════════════
 */
import providerData from '../data/providers.json';

const esim = providerData.esim as Record<string, { affiliate_url?: string }>;

/**
 * 从 provider 集合条目解析它的联盟链接。
 * 找不到对应家名时返回 '#'(说明 data/providers.json 的 esim 里漏建了这家)。
 */
export function affiliateUrlFor(provider: { id: string }): string {
  const key = provider.id.replace(/^en\//, '');
  return esim[key]?.affiliate_url ?? '#';
}
