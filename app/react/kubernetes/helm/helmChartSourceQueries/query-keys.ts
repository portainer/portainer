import { EnvironmentId } from '@/react/portainer/environments/types';
import { UserId } from '@/portainer/users/types';

export const queryKeys = {
  // Environment-scoped Helm queries (following kubernetes pattern)
  base: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'kubernetes', 'helm'] as const,

  // User's helm repositories/registries
  registries: (userId: UserId) => ['helm', 'registries', userId] as const,

  // Chart repository searches (global, not environment-specific)
  repositories: (chart: string, repo?: string, useCache?: boolean) =>
    ['helm', 'repositories', chart, repo, useCache] as const,

  // Chart listings from repositories (user-specific)
  charts: (userId: UserId, repository: string) =>
    ['helm', 'charts', userId, repository] as const,

  // Chart values (global, cached by chart/version)
  chartValues: (repo: string, chart: string, version: string | 'latest') =>
    ['helm', 'chart-values', repo, chart, version] as const,

  chartVersions: (
    sourceId: number | string,
    chart: string,
    useCache?: boolean
  ) => ['helm', 'registries', sourceId, chart, 'versions', useCache] as const,
};
