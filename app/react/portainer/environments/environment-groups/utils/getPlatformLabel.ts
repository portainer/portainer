import { EnvironmentGroup } from '../types';

export function getPlatformLabel(group: EnvironmentGroup): string {
  if (!group.Total || group.Total === 0) {
    return 'Empty';
  }

  const typeInfo = group.TypeInfo;
  if (!typeInfo) {
    return 'Mixed';
  }

  if (!typeInfo.Mixed) {
    if (typeInfo.Docker > 0) return 'Docker';
    if (typeInfo.Kubernetes > 0) return 'Kubernetes';
    if (typeInfo.Podman > 0) return 'Podman';
    return 'Empty';
  }

  return 'Mixed';
}

export function isUngoverned(group: EnvironmentGroup): boolean {
  return group.Id === 1;
}
