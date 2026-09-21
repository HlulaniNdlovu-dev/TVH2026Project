// Inline message box. tone: info | success | warn | error
export default function Banner({ tone = 'info', children, action }) {
  return (
    <div className={`banner banner-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <div className="grow">{children}</div>
      {action}
    </div>
  );
}
