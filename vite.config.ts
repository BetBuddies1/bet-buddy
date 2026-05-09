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
      manifest: {
        name: 'Bet Buddy',
        short_name: 'Bet Buddy',
        description: 'Ein lokales Partyspiel für Teams und mutige Wetten.',
        lang: 'de',
        theme_color: '#020B1F',
        background_color: '#020B1F',
        display: 'standalone',
        start_url: '/bet-buddy/',
        scope: '/bet-buddy/',
        icons: [
          {
            src: 'icons/buddy-mark-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icons/buddy-mark-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/bet-buddy/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,wav,mp3,json}'],
        globIgnores: ['**/icons/*.png'],
      },
    }),
  ],
  build: {
    sourcemap: false,
    rolldownOptions: {
      output: {
        minify:
          mode === 'production'
            ? {
                compress: {
                  dropConsole: true,
                  dropDebugger: true,
                },
                mangle: true,
                codegen: true,
              }
            : undefined,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
}));
