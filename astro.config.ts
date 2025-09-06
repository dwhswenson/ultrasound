// @ts-check
import { defineConfig, envField } from 'astro/config';
import { loadEnv } from 'vite';
import mdx from '@astrojs/mdx';
import analytics from './integrations/analytics';

const mode = process.env.MODE ?? process.env.NODE_ENV ?? 'development';
const env = loadEnv(mode, process.cwd(), '');

export default defineConfig({
  env: {
    schema: {
      PUBLIC_CF_BEACON_TOKEN: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_CLARITY_ID: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
  integrations: [
    analytics({
      cloudflareToken: env.PUBLIC_CF_BEACON_TOKEN,
      clarityId: env.PUBLIC_CLARITY_ID,
      onlyInProd: true,
    }),
    mdx()
  ]
});
