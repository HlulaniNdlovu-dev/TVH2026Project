import { Router } from 'express';
import * as simulator from '../controllers/simulatorController.js';

// The control panel for the built-in simulator (the client's /simulator page). No login, like before.
const router = Router();

router.get('/state', simulator.state);
router.post('/trip', simulator.trip);
router.post('/restore', simulator.restore);
router.post('/restore-all', simulator.restoreAll);
router.post('/scenario/:name', simulator.scenario);
router.post('/loadshedding', simulator.loadshedding);
router.post('/technicians', simulator.technicians);
router.post('/reset-backend', simulator.resetBackend);

export default router;
