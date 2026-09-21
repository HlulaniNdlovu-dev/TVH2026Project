import { config } from './config.js';
import { state, addLog } from './state.js';
import * as engine from './engine.js';
import { createServer } from './server.js';

state.speedMultiplier = config.defaultSpeedMultiplier;

// Runs an async job on a loop without ever overlapping itself or crashing the process.
function every(seconds, name, job) {
  let running = false;
  setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await job();
      state.connected = true;
    } catch (err) {
      state.connected = false;
      state.lastError = `${name}: ${err.message}`;
    } finally {
      running = false;
    }
  }, seconds * 1000);
}

createServer().listen(config.port, () => {
  console.log(`PowerLink simulator control panel: http://localhost:${config.port}`);
  console.log(`Sending readings to ${config.apiUrl}`);
});

engine.syncTopology().then(() => addLog(`Connected. Simulating ${state.nodes.length} sensors.`, 'ok')).catch((err) => {
  state.lastError = `Cannot reach the API: ${err.message}`;
  addLog(state.lastError, 'error');
});

every(config.tickMs / 1000, 'sensors', () => (state.nodes.length ? engine.tick() : engine.syncTopology()));
every(config.topologyRefreshSeconds, 'topology', engine.syncTopology);
every(config.commandPollSeconds, 'commands', engine.pollCommands);
every(config.technicianPollSeconds, 'technicians', engine.driveTechnicians);
