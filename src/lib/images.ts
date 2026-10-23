/**
 * 全站图片登记处:构建时自动收集 src/assets/images/ 里的所有图片(含子文件夹),
 * 之后任何地方都只用文件名来引用,不用写路径。
 *
 * 文件名写错时构建会直接失败(线上保留上一版),并在日志里给出最接近的文件名。
 */
import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import { IMAGE_DIR, missingImageMessage } from './image-names';

// 以 / 开头 = 从项目根目录算起,和这个文件放在哪无关。
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,avif,AVIF}',
  { eager: true }
);

const byName = new Map<string, ImageMetadata>();
for (const [path, mod] of Object.entries(modules)) {
  const name = path.split('/').pop()!;
  if (byName.has(name)) {
    throw new Error(
      `${IMAGE_DIR}/ 里有两张图都叫 "${name}"。引用时只写文件名,所以文件名必须唯一,请改掉其中一个。`
    );
  }
  byName.set(name, mod.default);
}

/** 按文件名取图片;找不到就让构建失败,并提示最接近的文件名。 */
export function getShot(name: string): ImageMetadata {
  const img = byName.get(name);
  if (!img) throw new Error(missingImageMessage(name, byName.keys()));
  return img;
}

/** 点开看的大图:转成 WebP,最宽 1440px,不会放大原图。 */
export async function fullSizeUrl(name: string): Promise<string> {
  const img = getShot(name);
  const out = await getImage({ src: img, width: Math.min(img.width, 1440), format: 'webp' });
  return out.src;
}

/** 列表页用:一次算好一批大图地址,返回 { 文件名: 地址 }。 */
export async function fullSizeUrls(names: (string | undefined)[]): Promise<Record<string, string>> {
  const unique = [...new Set(names.filter((n): n is string => Boolean(n)))];
  const entries = await Promise.all(unique.map(async (n) => [n, await fullSizeUrl(n)] as const));
  return Object.fromEntries(entries);
}
