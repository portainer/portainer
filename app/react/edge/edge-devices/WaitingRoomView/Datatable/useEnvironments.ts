import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';

import { useTags } from '@/portainer/tags/queries';
import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';
import { useGroups } from '@/react/portainer/environments/environment-groups/queries';
import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { EdgeTypes } from '@/react/portainer/environments/types';
import {
  Query,
  getSortType,
} from '@/react/portainer/environments/queries/useEnvironmentList';

import { WaitingRoomEnvironment } from '../types';

import { useFilterStore } from './filter-store';

export function useEnvironments({
  pageLimit = 10,
  search,
  sortBy,
}: {
  pageLimit: number;
  search: string;
  sortBy: { id: string; desc: boolean } | undefined;
}) {
  const [page, setPage] = useState(0);
  const filterStore = useFilterStore();
  const edgeGroupsQuery = useEdgeGroups();

  const filterByEnvironmentsIds = useMemo(
    () =>
      filterStore.edgeGroups.length
        ? _.compact(
            filterStore.edgeGroups.flatMap(
              (groupId) =>
                edgeGroupsQuery.data?.find((g) => g.Id === groupId)?.Endpoints
            )
          )
        : undefined,
    [edgeGroupsQuery.data, filterStore.edgeGroups]
  );

  const query: Partial<Query> = useMemo(
    () => ({
      pageLimit,
      edgeDeviceUntrusted: true,
      excludeSnapshots: true,
      types: EdgeTypes,
      tagIds: filterStore.tags.length ? filterStore.tags : undefined,
      groupIds: filterStore.groups.length ? filterStore.groups : undefined,
      endpointIds: filterByEnvironmentsIds,
      edgeCheckInPassedSeconds: filterStore.checkIn,
      search,
      sort: getSortType(sortBy?.id),
      order: sortBy?.desc ? 'desc' : 'asc',
    }),
    [
      filterByEnvironmentsIds,
      filterStore.checkIn,
      filterStore.groups,
      filterStore.tags,
      pageLimit,
      search,
      sortBy,
    ]
  );

  useEffect(() => {
    setPage(0);
  }, [query]);

  const environmentsQuery = useEnvironmentList({
    page: page + 1,
    ...query,
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

  const envs: Array<WaitingRoomEnvironment> = useMemo(
    () =>
      environmentsQuery.environments.map((env) => ({
        ...env,
        Group: (env.GroupId !== 1 && groupsQuery.data?.[env.GroupId]) || '',
        EdgeGroups:
          environmentEdgeGroupsQuery.data?.[env.Id]?.map((env) => env.group) ||
          [],
        Tags:
          _.compact(env.TagIds?.map((tagId) => tagsQuery.data?.[tagId])) || [],
      })),
    [
      environmentEdgeGroupsQuery.data,
      environmentsQuery.environments,
      groupsQuery.data,
      tagsQuery.data,
    ]
  );

  return useMemo(
    () => ({
      data: envs,
      isLoading:
        environmentsQuery.isLoading ||
        groupsQuery.isLoading ||
        environmentEdgeGroupsQuery.isLoading ||
        tagsQuery.isLoading,
      totalCount: environmentsQuery.totalCount,
      page,
      setPage,
    }),
    [
      environmentEdgeGroupsQuery.isLoading,
      environmentsQuery.isLoading,
      environmentsQuery.totalCount,
      envs,
      groupsQuery.isLoading,
      page,
      tagsQuery.isLoading,
    ]
  );
}
