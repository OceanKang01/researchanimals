import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Local API middleware: runs the Vercel serverless functions during dev
function localApiPlugin() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        const url = new URL(req.url, 'http://localhost')
        const filePath = path.join(__dirname, url.pathname + '.js')

        if (!existsSync(filePath)) return next()

        try {
          // Dynamic import with cache-bust for dev reload
          const mod = await import(filePath + '?t=' + Date.now())

          const query = Object.fromEntries(url.searchParams)

          await mod.default(
            { query, method: req.method, headers: req.headers },
            {
              _code: 200,
              status(code) { this._code = code; return this },
              json(data) {
                res.writeHead(this._code, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(data))
              }
            }
          )
        } catch (err) {
          console.error(`[API] ${url.pathname} error:`, err.message)
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err.message }))
          }
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
})
