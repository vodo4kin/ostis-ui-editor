import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['ts-sc-client'],
  },
  build: {
    commonjsOptions: {
      include: [/ts-sc-client/, /node_modules/],
    },
  },
})
