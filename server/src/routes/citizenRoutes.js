import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as citizen from '../controllers/citizenController.js';

const router = Router();
router.use(requireAuth, requireRole('citizen'));

router.get('/dashboard', citizen.dashboard);
router.get('/meters', citizen.meters);
router.post('/meters', citizen.addMeter);
router.delete('/meters/:meterNumber', citizen.removeMeter);
router.get('/incidents', citizen.incidents);
router.patch('/profile', citizen.updateProfile);
router.post('/reports', citizen.submitReport);

export default router;
