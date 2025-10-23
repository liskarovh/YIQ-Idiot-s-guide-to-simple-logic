import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Pokud budeš mít app v podcestě, uprav base.
// Pro SWA obvykle není třeba nic měnit.
export default defineConfig({
    plugins: [react()],
    build: { outDir: 'dist' }
})
