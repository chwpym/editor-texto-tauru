import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
  ],
  // Base dinâmica: só aplica o caminho do subdiretório no build de produção para o GitHub Pages
  base: command === 'build' ? '/editor-texto-tauru/' : '/',
  server: {
    port: 5173,
    strictPort: false, // Permite usar outras portas se a 5173 estiver ocupada
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
}));

