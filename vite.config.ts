import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

function localDevCsp() {
  return {
    name: 'local-dev-csp',
    apply: 'serve' as const,
    transformIndexHtml(html: string) {
      return html.replace("style-src 'self';", "style-src 'self' 'unsafe-inline';");
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: '/bet-buddy/',
  plugins: [
    localDevCsp(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'sounds/*.mp3'],
      manifest: {
        name: 'Bet Buddy',
        short_name: 'Bet Buddy',
        description: 'Ein lokales Partyspiel für Teams und mutige Wetten.',
        theme_color: '#020B1F',
        background_color: '#020B1F',
        display: 'standalone',
        start_url: '/bet-buddy/',
        scope: '/bet-buddy/',
        icons: [],
      },
      workbox: {
        navigateFallback: '/bet-buddy/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,mp3,json}'],
      },
    }),
  ],
  build: {
    sourcemap: false,
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
}));
