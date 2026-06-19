import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

// Testes da lógica pura (I8). Resolve os mesmos aliases do app (@shared/@renderer) e
// roda em ambiente Node — as funções testadas não dependem de DOM/Electron.
export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@renderer': resolve(__dirname, 'src/renderer/src')
    }
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts']
  }
})
