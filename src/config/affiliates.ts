/**
 * ═══════════════════════════════════════════════════════════════════
 *  联盟链接的唯一解析入口(THE AFFILIATE LINK RESOLVER)
 *
 *  全站所有"购买/查价"按钮的链接都从这里取,不在别处手写。
 *  链接存放在每家 provider 记录的 commercial 里:
 *    - commercial.affiliate_url            → 品牌默认链接
 *    - commercial.products.<产品>.affiliate_url → 同品牌某个具体产品的链接
 *  换联盟 ID / 子追踪标签时,只改那家记录的对应一处即可。
 * ═══════════════════════════════════════════════════════════════════
 */

type Commercial = {
  affiliate_url?: string;
  products?: Record<string, { affiliate_url?: string }>;
};

/**
 * 从 commercial 对象解析联盟链接。
 * - 不传 product → 取品牌默认链接(commercial.affiliate_url),没填则 '#'。
 * - 传了 product → 取 commercial.products.<product>.affiliate_url;
 *   若该产品没登记 → 直接抛错让构建失败(防止 <Aff product="拼错"> 静默指向默认链接)。
 */
export function resolveAffiliateUrl(
  commercial: Commercial | undefined,
  product?: string
): string {
  if (product) {
    const url = commercial?.products?.[product]?.affiliate_url;
    if (!url) {
      throw new Error(
        `联盟链接:找不到产品 "${product}"。请在该品牌的 commercial.products 里登记它,或检查 <Aff product="..."> / affiliateUrlFor(..., "...") 是否拼错。`
      );
    }
    return url;
  }
  return commercial?.affiliate_url ?? '#';
}

/**
 * 从 provider 集合条目解析联盟链接(可选指定产品)。
 * affiliateUrlFor(provider)                → 品牌默认链接(现有调用全不变)
 * affiliateUrlFor(provider, 'asia_pacific')→ 指定产品的链接
 */
export function affiliateUrlFor(
  provider: { data: { commercial?: Commercial } },
  product?: string
): string {
  return resolveAffiliateUrl(provider.data.commercial, product);
}
