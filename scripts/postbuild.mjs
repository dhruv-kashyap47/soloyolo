/**
 * Every `pnpm build` ends here: generate the Pages headers, prove no
 * measurement beacon slipped into the bundle, and — when PUBLIC_SITE_URL is
 * set — prove the artifact has the production shape.
 */
import process from 'node:process';
import { buildHeaders } from './build-headers.mjs';
import { checkNoBeacon } from './check-no-beacon.mjs';
import { checkProductionBuild } from './check-production-build.mjs';
import { writeSitemapAlias } from './lib/sitemap.mjs';

await buildHeaders();
await checkNoBeacon();
await writeSitemapAlias();

if (process.env.PUBLIC_SITE_URL) {
  await checkProductionBuild();
} else {
  console.log('production check: skipped (PUBLIC_SITE_URL is not set in this shell)');
}
