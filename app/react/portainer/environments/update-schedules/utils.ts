import { EnvironmentId } from '@/portainer/environments/types';

import { ScheduleStatus, StatusType } from './types';

export function getAggregatedStatus(status: {
  [key: EnvironmentId]: ScheduleStatus;
}): { status: StatusType; error?: string } {
  const statusList = Object.entries(status).map(
    ([environmentId, envStatus]) => ({ ...envStatus, environmentId })
  );

  if (statusList.length === 0) {
    return { status: StatusType.Pending };
  }

  const failedEnvironment = statusList.find(
    (s) => s.status === StatusType.Failed
  );

  if (failedEnvironment) {
    return {
      status: StatusType.Failed,
      error: `(ID: ${failedEnvironment.environmentId}) ${failedEnvironment.error}`,
    };
  }

  const hasSent = statusList.some((s) => s.status === StatusType.Sent);

  if (hasSent) {
    return { status: StatusType.Sent };
  }

  const isSuccess = statusList.every((s) => s.status === StatusType.Success);

  return isSuccess
    ? { status: StatusType.Success }
    : { status: StatusType.Pending };
}
