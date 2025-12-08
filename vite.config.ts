import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser', // Melhor compressão para produção
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log em produção
        drop_debugger: true,
      },
    },
    cssCodeSplit: true,
    sourcemap: false, // Desabilita sourcemaps em produção para segurança e tamanho
    rollupOptions: {
      output: {
        // Estratégia agressiva de Code Splitting
        manualChunks: {
          'react-core': ['react', 'react-dom'],
          'ui-libs': ['framer-motion', 'lucide-react'],
          'app-logic': ['zustand', 'uuid'],
          'dnd-kit': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'heavy-utils': ['html-to-image'], // Isolado pois é pesado e pouco usado
        }
      }
    }
  },
  plugins: [
    react()
  ],
});