// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// .env isn't loaded into process.env until after the config runs
const { HOST } = loadEnv(process.env.NODE_ENV ?? '', process.cwd(), '');

export default defineConfig({
  site: HOST,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
