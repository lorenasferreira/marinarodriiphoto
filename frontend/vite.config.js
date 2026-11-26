import { cpSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { env } from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const artisticBranchPreview = env.VERCEL_ENV === 'preview' &&
  env.VERCEL_GIT_COMMIT_REF === 'feature/marina-artistic-projects'

// Vite's public directory bypasses the route gate, so apply the same
// branch restriction when copying the unpublished media.
function copyPublicAssets() {
  let publicDir
  let outDir

  return {
    name: 'copy-approved-public-assets',
    apply: 'build',
    configResolved(config) {
      publicDir = config.publicDir
      outDir = resolve(config.root, config.build.outDir)
    },
    writeBundle() {
      const draftAssets = resolve(publicDir, 'assets/artistic')
      cpSync(publicDir, outDir, {
        recursive: true,
        filter: source => (artisticBranchPreview || source !== draftAssets) &&
          basename(source) !== '.DS_Store',
      })
    },
  }
}
export default defineConfig({
  define: { 'import.meta.env.ARTISTIC_BRANCH_PREVIEW': JSON.stringify(artisticBranchPreview) },
  plugins: [react(), copyPublicAssets()],
  build: { copyPublicDir: false },
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api/admin/': 'http://127.0.0.1:8080',
      '^/api/public/portfolio(?:/|$)': 'http://127.0.0.1:8080',
    },
  },
})
