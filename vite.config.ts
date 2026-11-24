import path from "path"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"
import { Readable } from "stream"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  process.env.ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY

  const elevenlabs = new ElevenLabsClient()

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'hero-bg.jpg'],
        manifest: {
          name: 'تواصل صحراء | Sahara Gather Connect',
          short_name: 'تواصل صحراء',
          description: 'منصة التواصل الاجتماعي والفعاليات لمنطقة وارجلان (ورقلة) وسدراتة',
          theme_color: '#301809',
          background_color: '#fdfbf7',
          display: 'standalone',
          orientation: 'portrait',
          dir: 'rtl',
          lang: 'ar',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              // Supabase Public Storage Images
              urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'supabase-images',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
                }
              }
            },
            {
              // Supabase REST API (Events, Heritage, RSVPs for Offline Access)
              urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-data',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 7 Days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // ESRI Satellite Map Tiles Cache
              urlPattern: /^https:\/\/server\.arcgisonline\.com\/.*MapServer\/tile\/.*/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'esri-map-tiles',
                expiration: {
                  maxEntries: 300,
                  maxAgeSeconds: 60 * 60 * 24 * 14 // 14 Days
                }
              }
            },
            {
              // Google Fonts Styles & Webfonts
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 Year
                }
              }
            }
          ]
        }
      }),
      {
        name: 'elevenlabs-dev-endpoint',
        configureServer(server) {
          server.middlewares.use('/api/elevenlabs/tts', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end('Method Not Allowed')
              return
            }

            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const { text, voiceId = 'JBFqnCBsd6RMkjVDRZzb' } = JSON.parse(body || '{}')
                if (!text) {
                  res.statusCode = 400
                  res.end('Missing text')
                  return
                }

                const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
                  text,
                  modelId: 'eleven_multilingual_v2',
                })

                res.setHeader('Content-Type', 'audio/mpeg')
                Readable.fromWeb(audioStream as any).pipe(res)
              } catch (error: any) {
                res.statusCode = 500
                res.end(error?.message || 'TTS Error')
              }
            })
          })
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
