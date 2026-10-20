import { createApp } from './app.js';
import { config } from './config/index.js';
import { loadDatabase } from './db/stubs.js';
import { startScheduler } from './services/gridService.js';
import * as demo from './services/demoService.js';
import * as simulator from './services/simulatorService.js';

// All data lives in memory and starts from the demo seed on every start.
loadDatabase();

const server = createApp().listen(config.port, '0.0.0.0', () => {
  console.log(`PowerLink API running on port ${config.port} (/api), demo data loaded`);
});

// Turns sensor states into incidents, refreshes priorities and dispatches technicians.
startScheduler(1000);

// The sensor and technician simulator runs in this process unless it is hosted on its own.
if (config.runSimulator) {
  simulator.start();
  demo.onReset(simulator.clearFaults);
  console.log('Built-in simulator running (control panel: the client\'s /simulator page)');
}

function shutdown() {
  server.close();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
