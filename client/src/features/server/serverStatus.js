import { useSyncExternalStore } from 'react';
import { ping } from '../../services/serverService.js';

// The hosted server sleeps when nobody uses it and takes up to a minute to start again. The app pings it as
// soon as it loads, keeps trying until it answers, and screens can show "waking up" until then.
let status = 'waking'; // 'waking' | 'awake'
const listeners = new Set();
let started = false;

function setStatus(next) {
  status = next;
  listeners.forEach((fn) => fn());
}

export function wakeServer() {
  if (started) return;
  started = true;
  const attempt = () => ping().then(() => setStatus('awake')).catch(() => setTimeout(attempt, 2000));
  attempt();
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const useServerStatus = () => useSyncExternalStore(subscribe, () => status);
