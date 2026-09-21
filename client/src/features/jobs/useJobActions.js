import { useState } from 'react';
import * as jobService from '../../services/jobService.js';
import { useToast } from '../../components/Toast.jsx';

// One place for every technician action on a job. Errors become toasts; `onChange` refreshes the screen.
export function useJobActions(jobId, onChange) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const run = async (action, success) => {
    setBusy(true);
    try {
      const result = await action();
      if (success) toast(success);
      await onChange?.(result);
      return result;
    } catch (err) {
      toast(err.message, 'error');
      return null;
    } finally {
      setBusy(false);
    }
  };

  return {
    busy,
    accept: () => run(() => jobService.acceptJob(jobId), 'Job accepted'),
    decline: (reason) => run(() => jobService.declineJob(jobId, reason), 'Job declined. It will be offered to someone else.'),
    travel: () => run(() => jobService.startTravel(jobId), 'On your way. The customer has been notified.'),
    start: () => run(() => jobService.startJob(jobId), 'Job started'),
    pause: (reason) => run(() => jobService.pauseJob(jobId, reason), 'Job paused'),
    resume: () => run(() => jobService.resumeJob(jobId), 'Job resumed'),
  };
}
