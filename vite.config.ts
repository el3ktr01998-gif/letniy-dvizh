import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// ВАЖНО: base должен совпадать с именем проекта в GitLab,
// т.к. Pages отдаёт сайт по адресу https://<username>.gitlab.io/letniy-dvizh/
export default defineConfig({
  base: '/letniy-dvizh/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Летний Движ',
        short_name: 'Движ',
        description: 'Верни себе вайб летних каникул: движухи, челленджи, трекинг',
        lang: 'ru',
        start_url: '/letniy-dvizh/',
        scope: '/letniy-dvizh/',
        display: 'standalone',
        background_color: '#fffbeb',
        theme_color: '#f59e0b',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}']
      }
    })
  ]
})
