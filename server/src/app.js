import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Local development: localhost, 127.0.0.1 and private Wi-Fi addresses (testing on a phone) on any port.
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;

export function createApp() {
  const app = express();
  const allowed = new Set([config.frontendUrl, ...config.corsOrigins].map((o) => o.replace(/\/$/, '')));
  app.use(
    cors({
      origin: (origin, callback) => callback(null, !origin || allowed.has(origin) || LOCAL_ORIGIN.test(origin)),
    }),
  );
  // Photos travel as base64 data URLs, so allow bigger bodies.
  app.use(express.json({ limit: '12mb' }));
  // Health check for the hosting platform.
  app.get('/health', (req, res) => res.json({ ok: true }));
  app.use('/api', routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
