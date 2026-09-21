import Icon from '../../components/Icon.jsx';
import { timeAgo } from '../../utils/format.js';

const TYPE_ICON = {
  reported: 'report', detected: 'sensor', verified: 'check', dispatched: 'user', en_route: 'truck', nearby: 'pin',
  arrived: 'pin', resumed: 'wrench', paused: 'clock', resolved: 'bolt', loadshedding: 'power',
};

export default function NotificationItem({ notification, onOpen }) {
  return (
    <button type="button" className={`notification ${notification.read ? '' : 'unread'} type-${notification.type}`} onClick={() => onOpen(notification)}>
      <span className="notification-icon"><Icon name={TYPE_ICON[notification.type] ?? 'bell'} size={20} /></span>
      <span className="grow" style={{ textAlign: 'left' }}>
        <span className="notification-title">{notification.title}</span>
        <span className="notification-text">{notification.message}</span>
        <span className="notification-time">{timeAgo(notification.createdAt)}{notification.incidentId ? ` · ${notification.incidentId}` : ''}</span>
      </span>
      {!notification.read && <span className="unread-dot" aria-label="Unread" />}
    </button>
  );
}
