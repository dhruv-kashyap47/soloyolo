import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import process from 'node:process';

const site = process.env.PUBLIC_SITE_URL ?? 'https://soloyolo.example.com';

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [
    preact(),
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
  // the dev toolbar floats over the page and takes Tab stops: keep the local
  // page exactly what production looks like
  devToolbar: { enabled: false },
  // Every page is static HTML: internal links prefetch on hover so the next
  // tool opens from cache instead of a cold fetch. No viewport prefetch, so
  // background traffic stays near zero until the visitor actually aims somewhere.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
