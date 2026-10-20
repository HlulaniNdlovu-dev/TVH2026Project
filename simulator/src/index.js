// Standalone mode: the simulator as its own process with its own control panel, talking to the API over HTTP.
// Normally the API runs the simulator itself (server/src/services/simulatorService.js) and the client shows the
// control panel at /simulator, so this is only needed to run the simulator somewhere else.
import { config } from './config.js';
import { startSimulation } from './runner.js';
import { createServer } from './server.js';

createServer().listen(config.port, () => {
  console.log(`PowerLink simulator control panel: http://localhost:${config.port}`);
  console.log(`Sending readings to ${config.apiUrl}`);
});

startSimulation();
