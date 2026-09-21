import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as admin from '../controllers/adminController.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/overview', admin.overview);
router.get('/grid', admin.grid);
router.get('/incidents', admin.incidents);
router.get('/incidents/:id', admin.incident);
router.post('/incidents/:id/verify', admin.verify);
router.post('/incidents/:id/priority', admin.priority);
router.post('/incidents/:id/assign', admin.assign);
router.get('/dispatch-board', admin.dispatchBoard);
router.get('/technicians', admin.technicians);
router.get('/sensors', admin.sensors);
router.get('/analytics', admin.analyticsSummary);
router.get('/audit', admin.auditLog);
router.get('/loadshedding', admin.loadsheddingList);
router.post('/loadshedding/upload', admin.loadsheddingUpload);

export default router;
