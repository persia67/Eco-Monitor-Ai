import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    base: './',
    plugins: [react()],
    define: {
      'process.env': env
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: false,
      proxy: {
        '/api/iranemp/data': {
          target: 'https://iranemp.ir',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/iranemp\/data/, '/api/v1/monitoring/data'),
          secure: false
        }
      }
    }
  };
});