import { defineConfig } from 'astro/config';
import site from './site.config.json' with { type: 'json' };

export default defineConfig({
  site: `https://${site.domain}`,
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'always', // no render-blocking CSS request
  },
  compressHTML: true,
  devToolbar: { enabled: false },
});
