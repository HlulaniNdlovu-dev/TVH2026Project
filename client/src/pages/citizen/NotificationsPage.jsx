import { useState } from 'react';
import { usePolling } from '../../hooks/usePolling.js';
import { listNotifications, markAllRead, markRead } from '../../services/notificationService.js';
import NotificationItem from '../../features/notifications/NotificationItem.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import Spinner from '../../components/Spinner.jsx';
import { formatDateTime } from '../../utils/format.js';

export default function NotificationsPage() {
  const { data, loading, refresh, setData } = usePolling(listNotifications, 4000, [], 'citizen:notifications');
  const [selected, setSelected] = useState(null);

  // Opens the detail popup and, the first time, marks it read. Highlighting drops away because
  // `data` is updated immediately, before the server confirms.
  const open = async (notification) => {
    setSelected(notification);
    if (notification.read) return;
    setData((list) => list.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
    await markRead(notification.id).catch(() => {});
    refresh();
  };

  const readAll = async () => {
    await markAllRead();
    refresh();
  };

  const unread = (data ?? []).filter((n) => !n.read).length;

  return (
    <div className="stack">
      <div className="row-between page-title">
        <div>
          <h1 style={{ marginBottom: 2 }}>Notifications</h1>
          <p>{unread ? `${unread} unread` : 'You are all caught up.'}</p>
        </div>
        {unread > 0 && <button type="button" className="btn btn-outline btn-sm" onClick={readAll}>Mark all read</button>}
      </div>

      {loading && !data ? <Spinner /> : data?.length ? (
        <div className="notification-list">
          {data.map((n) => <NotificationItem key={n.id} notification={n} onOpen={open} />)}
        </div>
      ) : (
        <EmptyState title="No notifications yet">Updates about your outages and repairs will show up here.</EmptyState>
      )}

      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <p style={{ marginTop: 0 }}>{selected.message}</p>
          <p className="muted small" style={{ marginBottom: 0 }}>
            {formatDateTime(selected.createdAt)}{selected.incidentId ? ` · ${selected.incidentId}` : ''}
          </p>
        </Modal>
      )}
    </div>
  );
}
