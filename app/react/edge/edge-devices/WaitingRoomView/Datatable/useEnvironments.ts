import _ from 'lodash';

import { useTags } from '@/portainer/tags/queries';
import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';
import { useGroups } from '@/react/portainer/environments/environment-groups/queries';
import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { EdgeTypes } from '@/react/portainer/environments/types';

import { WaitingRoomEnvironment } from '../types';

import { useFilterStore } from './filter-store';

export function useEnvironments() {
  const filterStore = useFilterStore();
  const edgeGroupsQuery = useEdgeGroups();

  const filterByEnvironmentsIds = filterStore.edgeGroups.length
    ? _.compact(
        filterStore.edgeGroups.flatMap(
          (groupId) =>
            edgeGroupsQuery.data?.find((g) => g.Id === groupId)?.Endpoints
        )
      )
    : undefined;

  const environmentsQuery = useEnvironmentList({
    edgeDeviceUntrusted: true,
    excludeSnapshots: true,
    types: EdgeTypes,
    tagIds: filterStore.tags.length ? filterStore.tags : undefined,
    groupIds: filterStore.groups.length ? filterStore.groups : undefined,
    endpointIds: filterByEnvironmentsIds,
    edgeCheckInPassedSeconds: filterStore.checkIn,
  });

  const groupsQuery = useGroups({
    select: (groups) =>
      Object.fromEntries(groups.map((g) => [g.Id, g.Name] as const)),
  });
  const environmentEdgeGroupsQuery = useEdgeGroups({
    select: (groups) =>
      _.groupBy(
        groups.flatMap((group) => {
          const envs = group.Endpoints;
          return envs.map((id) => ({ id, group: group.Name }));
        }),
        (env) => env.id
      ),
  });
  const tagsQuery = useTags({
    select: (tags) =>
      Object.fromEntries(tags.map((tag) => [tag.ID, tag.Name] as const)),
  });

  const envs: Array<WaitingRoomEnvironment> =
    environmentsQuery.environments.map((env) => ({
      ...env,
      Group: (env.GroupId !== 1 && groupsQuery.data?.[env.GroupId]) || '',
      EdgeGroups:
        environmentEdgeGroupsQuery.data?.[env.Id]?.map((env) => env.group) ||
        [],
      Tags:
        _.compact(env.TagIds?.map((tagId) => tagsQuery.data?.[tagId])) || [],
    }));

  return {
    data: envs,
    isLoading:
      environmentsQuery.isLoading ||
      groupsQuery.isLoading ||
      environmentEdgeGroupsQuery.isLoading ||
      tagsQuery.isLoading,
    totalCount: environmentsQuery.totalCount,
  };
}
