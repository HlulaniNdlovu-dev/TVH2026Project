import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as jobs from '../controllers/jobController.js';

const router = Router();
router.use(requireAuth, requireRole('technician'));

router.get('/jobs', jobs.mine);
router.get('/jobs/:id', jobs.get);
router.post('/jobs/:id/accept', jobs.accept);
router.post('/jobs/:id/decline', jobs.decline);
router.post('/jobs/:id/travel', jobs.travel);
router.post('/jobs/:id/start', jobs.start);
router.post('/jobs/:id/pause', jobs.pause);
router.post('/jobs/:id/resume', jobs.resume);
router.post('/jobs/:id/close', jobs.close);
router.patch('/duty', jobs.setDuty);

export default router;
