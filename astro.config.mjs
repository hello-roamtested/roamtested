import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
// Site URL: update this once the domain is connected on Cloudflare Pages.
export default defineConfig({
  site: 'https://roamtested.com',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],
  // i18n scaffold: English only for now. To add Chinese later,
  // add 'zh' to locales and create matching content under src/content/*/zh/.
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
    routing: { prefixDefaultLocale: false },
  },
});
