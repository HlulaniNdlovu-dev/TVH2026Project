import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as auth from '../controllers/authController.js';

const router = Router();

router.post('/login', auth.login);
router.post('/register', auth.register);
router.get('/me', requireAuth, auth.me);

export default router;
