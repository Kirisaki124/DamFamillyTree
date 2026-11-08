import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' -> all asset URLs are relative, so dist/ works from any S3 bucket or sub-folder.
export default defineConfig({
  base: './',
  plugins: [react()],
})
