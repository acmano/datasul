import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(), // Permite import SVG como componente
    tsconfigPaths(), // Suporte a path aliases do tsconfig.json
  ],

  // Configuração do servidor de desenvolvimento
  server: {
    host: '0.0.0.0', // Escuta em todas as interfaces (acesso via lor0138.lorenzetti.ibe)
    port: 3000,
    open: false, // Não abre navegador automaticamente (evita erro xdg-open)
    cors: true,
    strictPort: false,
    // Hosts permitidos (domínios customizados Lorenzetti)
    allowedHosts: [
      'lor0138.lorenzetti.ibe',
      'localhost',
      '.lorenzetti.ibe',
    ],
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
  },

  // Configuração de build
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'chart-vendor': ['echarts', 'echarts-for-react'],
          'office-vendor': ['xlsx', 'jspdf', 'jspdf-autotable', 'file-saver'],
        },
      },
    },
  },

  // Resolução de módulos
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
    },
  },

  // Definir variáveis de ambiente globais
  define: {
    'process.env': {},
  },

  // Otimizações
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd'],
  },
});
