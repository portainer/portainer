import { useMemo } from 'react';

import { EnvironmentGroup } from '@/react/portainer/environments/environment-groups/types';
import { EnvironmentsQueryParams } from '@/react/portainer/environments/environment.service';
import {
  EdgeTypes,
  EnvironmentStatus,
  PlatformType,
} from '@/react/portainer/environments/types';

export function useParseSortGroupApiParams(
  sortGroupFilter: string | null,
  sortKey: string,
  groupQueryData: EnvironmentGroup[] | undefined
) {
  return useMemo<Partial<EnvironmentsQueryParams>>(() => {
    if (!sortGroupFilter) return {};
    switch (sortKey) {
      case 'Group': {
        const group = groupQueryData
          ? groupQueryData.find((g) => g.Id.toString() === sortGroupFilter)
          : undefined;
        return group ? { groupIds: [group.Id] } : {};
      }
      case 'Platform': {
        const typesByPlatform: Record<string, PlatformType> = {
          Docker: PlatformType.Docker,
          Podman: PlatformType.Podman,
          Kubernetes: PlatformType.Kubernetes,
          Azure: PlatformType.Azure,
        };
        const platformType = typesByPlatform[sortGroupFilter];
        return {
          types: [],
          platformTypes: platformType !== undefined ? [platformType] : [],
        };
      }
      case 'Health': {
        if (sortGroupFilter === 'Outdated') {
          return { outdated: true };
        }
        if (sortGroupFilter === 'Heartbeat') {
          // Edge envs with an active heartbeat: backend derives Up/Down from
          // check-in timing, so filter to edge types with derived status=Up.
          return {
            types: [...EdgeTypes],
            status: [EnvironmentStatus.Up],
          };
        }
        const statusByLabel: Record<string, EnvironmentStatus[]> = {
          Up: [EnvironmentStatus.Up],
          Down: [EnvironmentStatus.Down],
        };
        return { status: statusByLabel[sortGroupFilter] ?? [] };
      }
      default:
        return {};
    }
  }, [sortGroupFilter, sortKey, groupQueryData]);
}
