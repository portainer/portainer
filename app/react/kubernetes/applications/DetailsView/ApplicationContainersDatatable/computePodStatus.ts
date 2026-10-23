import { Pod } from 'kubernetes-types/core/v1';

import { ContainerStatusInfo } from './types';

export function computePodStatus(pod: Pod): ContainerStatusInfo {
  if (pod.metadata?.deletionTimestamp) {
    return {
      status: 'Terminating',
      type: 'warn',
      message: 'Pod is being deleted.',
    };
  }

  const phase = pod.status?.phase;
  const message = pod.status?.message;
  const reason = pod.status?.reason;
  const containerStatuses = pod.status?.containerStatuses ?? [];

  switch (phase) {
    case undefined:
      return {
        status: 'Unknown',
        type: 'muted',
        message: message || 'Pod status cannot be determined from the cluster.',
      };
    case 'Running': {
      const total = containerStatuses.length;
      const ready = containerStatuses.filter((c) => c.ready).length;
      if (total > 0 && ready < total) {
        return {
          status: 'Running (not ready)',
          type: 'warn',
          message:
            message ||
            `${ready} of ${total} containers are ready. Check readiness probes.`,
        };
      }
      return { status: 'Running', type: 'success' };
    }
    case 'Pending':
      return {
        status: 'Pending',
        type: 'muted',
        message: message || reason,
      };
    case 'Succeeded':
      return { status: 'Succeeded', type: 'info', message };
    case 'Failed':
      return {
        status: 'Failed',
        type: 'danger',
        message: message || reason || 'Pod failed.',
      };
    default:
      return {
        status: 'Unknown',
        type: 'muted',
        message: message || 'Pod status cannot be determined from the cluster.',
      };
  }
}
