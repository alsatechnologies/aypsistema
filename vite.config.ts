import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy para la API de certificados de ENTRADA (Reciba)
      '/api/generate-certificate-entrada': {
        target: 'https://pdf-entrada.alsatechnologies.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/generate-certificate-entrada/, '/generate-certificate'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy entrada error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('ENTRADA - Sending Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('ENTRADA - Response:', proxyRes.statusCode, req.url);
          });
        },
      },
      // Proxy para la API de certificados de SALIDA (Embarque)
      '/api/generate-certificate-salida': {
        target: 'https://pdf-salida.alsatechnologies.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/generate-certificate-salida/, '/generate-certificate'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy salida error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('SALIDA - Sending Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('SALIDA - Response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
