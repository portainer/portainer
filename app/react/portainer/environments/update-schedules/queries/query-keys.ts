import { EnvironmentId } from '@/react/portainer/environments/types';

import { EdgeUpdateSchedule } from '../types';

export const queryKeys = {
  list: () => ['edge', 'update_schedules'] as const,
  item: (id: EdgeUpdateSchedule['id']) => [...queryKeys.list(), id] as const,
  activeSchedules: (environmentIds: EnvironmentId[]) =>
    [queryKeys.list(), 'active', { environmentIds }] as const,
  supportedAgentVersions: () => [queryKeys.list(), 'agent_versions'] as const,
  previousVersions: () => [queryKeys.list(), 'previous_versions'] as const,
};
