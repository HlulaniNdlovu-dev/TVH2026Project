import { createApp } from './app.js';
import { config } from './config/index.js';
import { initDatabase } from './db/init.js';
import { startScheduler } from './services/gridService.js';

try {
  await initDatabase();
} catch (err) {
  console.error(`Cannot use the MySQL database: ${err.message}`);
  console.error('Start a local MySQL, or set the ONLINE_DB_* (or DATABASE_URL) variables.');
  process.exit(1);
}

createApp().listen(config.port, '0.0.0.0', () => {
  console.log(`PowerLink API running on port ${config.port} (/api)`);
  console.log(`Simulator device key: ${config.deviceKey}`);
});

// Turns sensor states into incidents, refreshes priorities and dispatches technicians.
startScheduler();
