import { useCallback, useState } from 'react';
import { useToast } from '../../components/Toast.jsx';

// Wraps a simulator call: shows errors as a toast and refreshes the panel straight after, so a click shows at once.
export function useSimulatorAction(refresh) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (call, successMessage) => {
    setBusy(true);
    try {
      await call();
      if (successMessage) toast(successMessage);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
      refresh(true);
    }
  }, [refresh, toast]);

  return { run, busy };
}
