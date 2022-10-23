import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { EdgeUpdateSchedule, ScheduleType, StatusType } from '../types';

import { queryKeys } from './query-keys';
import { buildUrl } from './urls';

export interface ActiveSchedule {
  environmentId: EnvironmentId;
  scheduleId: EdgeUpdateSchedule['id'];
  targetVersion: string;
  status: StatusType;
  error: string;
  type: ScheduleType;
}

async function getActiveSchedules(environmentIds: EnvironmentId[]) {
  try {
    const { data } = await axios.post<ActiveSchedule[]>(
      buildUrl(undefined, 'active'),
      { environmentIds }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(
      err as Error,
      'Failed to get list of edge update schedules'
    );
  }
}

export function useActiveSchedules(environmentIds: EnvironmentId[]) {
  return useQuery(
    queryKeys.activeSchedules(environmentIds),
    () => getActiveSchedules(environmentIds),
    { enabled: environmentIds.length > 0 }
  );
}
