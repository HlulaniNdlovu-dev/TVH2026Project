import { Router } from 'express';
import { requireDeviceKey } from '../middleware/auth.js';
import * as telemetry from '../controllers/telemetryController.js';

// Everything the sensor simulator talks to. Protected by a shared device key.
const router = Router();
router.use(requireDeviceKey);

router.post('/readings', telemetry.readings);
router.get('/topology', telemetry.topology);
router.get('/technicians', telemetry.technicianTargets);
router.post('/technician-locations', telemetry.technicianLocations);
router.get('/commands', telemetry.commands);
router.post('/loadshedding', telemetry.startLoadshedding);

export default router;
