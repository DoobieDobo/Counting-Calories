import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// `base` is set for GitHub Pages project-site hosting
// (https://doobiedobo.github.io/Counting-Calories/). Local dev and preview
// ignore it, so this is safe to leave on.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/Counting-Calories/' : '/',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
