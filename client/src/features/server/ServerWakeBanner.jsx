import Banner from '../../components/Banner.jsx';
import { useServerStatus } from './serverStatus.js';

// Shown on the login and register pages while the hosted server is still starting.
export default function ServerWakeBanner() {
  if (useServerStatus() === 'awake') return null;
  return <Banner tone="info">Waking up the server. This can take up to a minute the first time…</Banner>;
}
