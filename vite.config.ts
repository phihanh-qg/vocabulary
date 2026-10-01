import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function localDataSyncPlugin() {
  return {
    name: 'local-data-sync',
    configureServer(server: any) {
      server.middlewares.use('/api/sync', (req: any, res: any) => {
        const filePath = path.resolve(__dirname, 'data/study_data.json');

        if (req.method === 'GET') {
          if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            return res.end(data);
          } else {
            res.statusCode = 404;
            return res.end(JSON.stringify({ status: 'not_found' }));
          }
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              fs.mkdirSync(path.dirname(filePath), { recursive: true });
              fs.writeFileSync(filePath, body, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'saved', timestamp: new Date().toISOString() }));
            } catch (err: any) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ status: 'error', message: err.message }));
            }
          });
          return;
        }

        res.statusCode = 405;
        res.end('Method Not Allowed');
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localDataSyncPlugin()],
});
