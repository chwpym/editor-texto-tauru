import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  base: './', // Para funcionar corretamente no GitHub Pages
  server: {
    port: 5173,
    strictPort: true,
  },
});
