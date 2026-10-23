/**
 * 图片文件名的公共规则。content.config.ts(构建前的数据校验)和 images.ts(页面渲染)共用。
 *
 * 规则只有一条:所有图片都放在 src/assets/images/ 里(要不要建子文件夹随你),
 * 引用时只写文件名(带扩展名),不写路径。所以文件名在整个文件夹里必须唯一。
 */
export const IMAGE_DIR = 'src/assets/images';
export const IMAGE_EXT_RE = /\.(png|jpe?g|webp|avif)$/i;

/** 两个字符串之间要改几个字才能一样(编辑距离)。 */
function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** 找不到图片时,给出最像的几个文件名,方便一眼看出是哪里写错了。 */
export function closestNames(name: string, names: Iterable<string>, max = 3): string[] {
  const target = name.toLowerCase();
  return [...names]
    .map((n) => ({ n, d: editDistance(target, n.toLowerCase()) }))
    .filter(({ d }) => d <= Math.max(3, Math.floor(target.length * 0.3)))
    .sort((x, y) => x.d - y.d)
    .slice(0, max)
    .map(({ n }) => n);
}

/** 统一的报错文字。 */
export function missingImageMessage(name: string, names: Iterable<string>): string {
  const hint = closestNames(name, names);
  return (
    `找不到图片 "${name}"(${IMAGE_DIR}/ 下没有这个文件名)。` +
    `文件名要带扩展名,大小写也要一致。` +
    (hint.length ? `最接近的文件:${hint.join('、')}` : '')
  );
}
