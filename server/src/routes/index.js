import { Router } from 'express';
import { requireAuth, requireDeviceOrAdmin } from '../middleware/auth.js';
import { meta, health } from '../controllers/metaController.js';
import { getPhoto } from '../controllers/photoController.js';
import * as telemetry from '../controllers/telemetryController.js';
import authRoutes from './authRoutes.js';
import citizenRoutes from './citizenRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import technicianRoutes from './technicianRoutes.js';
import adminRoutes from './adminRoutes.js';
import telemetryRoutes from './telemetryRoutes.js';

const router = Router();

router.get('/health', health);
router.get('/meta', meta);
router.get('/photos/:id', getPhoto);

router.use('/auth', authRoutes);
router.use('/citizen', citizenRoutes);
router.use('/notifications', requireAuth, notificationRoutes);
router.use('/technician', technicianRoutes);
router.use('/admin', adminRoutes);
router.use('/telemetry', telemetryRoutes);

// Reset the in-memory database back to the seeded demo data (simulator or admin).
router.post('/demo/reset', requireDeviceOrAdmin, telemetry.reset);

export default router;
