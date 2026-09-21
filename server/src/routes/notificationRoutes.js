import { Router } from 'express';
import * as notifications from '../controllers/notificationController.js';

const router = Router();

router.get('/', notifications.list);
router.get('/unread-count', notifications.unreadCount);
router.get('/sms', notifications.sms);
router.post('/read-all', notifications.markAllRead);
router.post('/:id/read', notifications.markRead);

export default router;
