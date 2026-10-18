import { usePolling } from '../../hooks/usePolling.js';
import { getUnreadCount } from '../../services/notificationService.js';

// Powers the red badge on the Alerts tab.
export function useUnreadCount() {
  const { data } = usePolling(getUnreadCount, 3000, [], 'notifications:unread-count');
  return data ?? 0;
}
