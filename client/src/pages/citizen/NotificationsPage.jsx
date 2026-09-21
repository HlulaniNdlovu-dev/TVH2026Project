import { useState } from 'react';
import { usePolling } from '../../hooks/usePolling.js';
import { listNotifications, listSms, markAllRead, markRead } from '../../services/notificationService.js';
import NotificationItem from '../../features/notifications/NotificationItem.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Spinner from '../../components/Spinner.jsx';
import Banner from '../../components/Banner.jsx';
import { timeAgo } from '../../utils/format.js';

export default function NotificationsPage() {
  const [tab, setTab] = useState('app');
  const { data, loading, refresh, setData } = usePolling(listNotifications, 4000);
  const sms = usePolling(listSms, 6000);

  const open = async (notification) => {
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
        {tab === 'app' && unread > 0 && <button type="button" className="btn btn-outline btn-sm" onClick={readAll}>Mark all read</button>}
      </div>

      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'app'} className={tab === 'app' ? 'active' : ''} onClick={() => setTab('app')}>In-app</button>
        <button type="button" role="tab" aria-selected={tab === 'sms'} className={tab === 'sms' ? 'active' : ''} onClick={() => setTab('sms')}>SMS inbox</button>
      </div>

      {tab === 'app' && (
        loading && !data ? <Spinner /> : data?.length ? (
          <div className="notification-list">
            {data.map((n) => <NotificationItem key={n.id} notification={n} onOpen={open} />)}
          </div>
        ) : (
          <EmptyState title="No notifications yet">Updates about your outages and repairs will show up here.</EmptyState>
        )
      )}

      {tab === 'sms' && (
        <>
          <Banner tone="info">SMS messages are simulated in this prototype: they appear here instead of being sent to a phone.</Banner>
          {sms.data?.length ? (
            <div className="stack-sm">
              {sms.data.map((m) => (
                <div key={m.id} className="sms-bubble">
                  <div>{m.body}</div>
                  <div className="small muted">to {m.to} · {timeAgo(m.createdAt)}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No SMS messages">Turn on SMS alerts in your profile to receive them.</EmptyState>
          )}
        </>
      )}
    </div>
  );
}
