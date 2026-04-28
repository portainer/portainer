import { useMemo } from 'react';

import {
  EnvironmentSummaryCounts,
  GroupCount,
  HealthCounts,
  PlatformCounts,
} from '@/react/portainer/environments/environment.service';
import { getPlatformIconByPlatform } from '@/react/portainer/environments/utils/get-platform-icon';
import { getGroupIcon } from '@/react/portainer/environments/utils/get-group-icon';
import { getHealthIcon } from '@/react/portainer/environments/utils/get-health-icon';
import {
  EnvironmentHealth,
  PlatformType,
} from '@/react/portainer/environments/types';

import { GroupEntry } from '@@/GroupSortTable/GroupSortTable';

export function useAvailableSortGroups(
  summaryQueryData: EnvironmentSummaryCounts | undefined
) {
  return useMemo<Record<string, GroupEntry[]>>(
    () => ({
      Group: summaryQueryData
        ? buildGroupEntries(summaryQueryData.byGroup ?? [])
        : [],
      Platform: summaryQueryData
        ? buildPlatformEntries(summaryQueryData.byPlatformType ?? [])
        : [],
      Health: summaryQueryData
        ? buildHealthEntries(summaryQueryData.byHealth ?? [])
        : [],
    }),
    [summaryQueryData]
  );
}

function buildGroupEntries(byGroup: GroupCount[]): GroupEntry[] {
  return byGroup.map(({ groupName, groupID, count }) => ({
    key: groupID.toString(),
    label: groupName,
    count,
    icon: getGroupIcon('sm'),
  }));
}

function buildPlatformEntries(byPlatformType: PlatformCounts): GroupEntry[] {
  const categories: Array<{
    key: keyof PlatformCounts;
    platformType: PlatformType;
  }> = [
    { key: 'docker', platformType: PlatformType.Docker },
    { key: 'kubernetes', platformType: PlatformType.Kubernetes },
    { key: 'podman', platformType: PlatformType.Podman },
    { key: 'azure', platformType: PlatformType.Azure },
  ];
  return categories
    .map(({ key, platformType }) => ({
      key: PlatformType[platformType],
      count: byPlatformType[key] ?? 0,
      icon: getPlatformIconByPlatform(platformType, 'sm'),
    }))
    .filter(({ count }) => count > 0);
}

function buildHealthEntries(byHealth: HealthCounts): GroupEntry[] {
  const categories: Array<{ key: keyof HealthCounts; healthStatus: number }> = [
    { key: 'down', healthStatus: EnvironmentHealth.Down },
    { key: 'outdated', healthStatus: EnvironmentHealth.Outdated },
    { key: 'up', healthStatus: EnvironmentHealth.Up },
    { key: 'heartbeat', healthStatus: EnvironmentHealth.Heartbeat },
  ];

  return categories
    .map(({ key, healthStatus }) => ({
      key: EnvironmentHealth[healthStatus],
      count: byHealth[key] ?? 0,
      icon: getHealthIcon(healthStatus, 'sm'),
    }))
    .filter(({ count }) => count > 0);
}
