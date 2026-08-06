/**
 * 站点全局配置。改品牌口号、邮箱、菜单都在这里。
 */
export const SITE = {
  name: 'RoamTested',
  domain: 'roamtested.com',
  tagline: 'eSIMs for China, tested on the ground.',
  description:
    'Independent, hands-on eSIM reviews for travel in China. Real speed tests, app-by-app firewall checks, and transparent scoring — tested in China, not from a desk.',
  contactEmail: 'hello@roamtested.com',
  // 作者档案:测评署名用。集中存这里,不写进每篇文章的 frontmatter。
  author: {
    name: 'Vesper D.',
    // 标题下那行短署名(面向英文读者),点名字跳转到下面的 url
    role: 'Digital nomad currently based in China, focused on travel eSIMs',
    url: '/about/',
  },
};

export const NAV = [
  { href: '/', label: 'Rankings' },
  { href: '/reviews/', label: 'Reviews' },
  { href: '/esim-promo-codes/', label: 'Deals' },
  { href: '/guides/', label: 'Guides' },
  { href: '/speed-tests/', label: 'Speed Tests' },
  { href: '/app-access/', label: 'App Access' },
  { href: '/faq/', label: 'FAQ' },
  { href: '/about/', label: 'About' },
];
