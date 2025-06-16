import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer',
    },
  },
  define: {
    global: 'globalThis'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'web3-core': ['wagmi', 'viem', '@privy-io/react-auth'],
          'ui-vendor': ['react', 'react-dom'],
          'radix-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover'
          ],
        }
      }
    },
    target: 'esnext',
    sourcemap: true
  },
  optimizeDeps: {
    include: ['wagmi', 'viem', '@tanstack/react-query']
  },
  server: {
    port: 3000,
    open: true
  }
})