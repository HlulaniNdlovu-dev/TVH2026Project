import { createApp } from './app.js';
import { config } from './config/index.js';
import { startScheduler } from './services/gridService.js';

createApp().listen(config.port, '0.0.0.0', () => {
  console.log(`PowerLink API running on http://localhost:${config.port}/api`);
  console.log(`Simulator device key: ${config.deviceKey}`);
});

// Turns sensor states into incidents, refreshes priorities and dispatches technicians.
startScheduler();
