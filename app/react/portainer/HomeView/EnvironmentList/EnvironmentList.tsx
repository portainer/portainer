import React, { useEffect, useMemo, useRef } from 'react';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { ColumnDef, Row } from '@tanstack/react-table';

import {
  Environment,
  EnvironmentStatus,
  PlatformType,
  EnvironmentHealth,
} from '@/react/portainer/environments/types';
import {
  refetchIfAnyOffline,
  SortType,
  useEnvironmentList,
} from '@/react/portainer/environments/queries/useEnvironmentList';
import { useGroups } from '@/react/portainer/environments/environment-groups/queries';
import { EnvironmentsQueryParams } from '@/react/portainer/environments/environment.service';
import { useIsPureAdmin } from '@/react/hooks/useUser';
import {
  getPlatformType,
  isEdgeEnvironment,
} from '@/react/portainer/environments/utils';
import { useEnvironmentSummaryCounts } from '@/react/portainer/environments/queries/useEnvironmentSummaryCounts';
import { useParseSortGroupApiParams } from '@/react/portainer/environments/queries/useParseApiSortParams';
import { useBaseApiQueryParams } from '@/react/portainer/environments/queries/useBaseApiQueryParams';
import { useAvailableSortGroups } from '@/react/portainer/environments/queries/useAvailableSortGroups';
import { useUpdateEffect } from '@/react/hooks/useUpdateEffect';
import { getPlatformIconByPlatform } from '@/react/portainer/environments/utils/get-platform-icon';
import { getHealthIcon } from '@/react/portainer/environments/utils/get-health-icon';
import { getGroupIcon } from '@/react/portainer/environments/utils/get-group-icon';
import { UpdateBadge } from '@/react/portainer/HomeView/EnvironmentList/UpdateBadge';
import { KubeconfigButton } from '@/react/portainer/HomeView/EnvironmentList/KubeconfigButton';
import { EnvironmentCard } from '@/react/portainer/HomeView/EnvironmentList/EnvironmentItem/EnvironmentCard';

import { GroupSortTable } from '@@/GroupSortTable/GroupSortTable';
import { GroupSortTableGroupRow } from '@@/GroupSortTable/GroupSortTableGroupRow';
import { useGroupSortTableState } from '@@/GroupSortTable/useGroupSortTableState';

import type { HeaderFilter } from '../EnvironmentHeader/EnvironmentHeader';

import { NoEnvironmentsInfoPanel } from './NoEnvironmentsInfoPanel';

interface Props {
  onClickBrowse(environment: Environment): void;

  headerFilter?: HeaderFilter;
  onHeaderFilterChange?: (filter: HeaderFilter) => void;
}

// Display order for health groups: Down surfaces first so it stands out.
const HEALTH_SORT_ORDER: Record<string, number> = {
  Down: 0,
  Outdated: 1,
  Heartbeat: 2,
  Up: 3,
  Unknown: 99,
};

const columns: ColumnDef<EnvironmentRow>[] = [
  { id: 'Platform', accessorKey: 'platformName' },
  { id: 'Group', accessorKey: 'groupName' },
  {
    id: 'Health',
    accessorKey: 'healthLabel',
    sortingFn: (a, b) =>
      (HEALTH_SORT_ORDER[a.original.healthLabel] ?? HEALTH_SORT_ORDER.Unknown) -
      (HEALTH_SORT_ORDER[b.original.healthLabel] ?? HEALTH_SORT_ORDER.Unknown),
  },
  { id: 'Name', accessorKey: 'Name' },
];

const SORT_OPTIONS = [
  { key: 'Group', label: 'Group', grouped: true },
  { key: 'Platform', label: 'Platform', grouped: true },
  { key: 'Health', label: 'Health', grouped: true },
];

const storageKey = 'home_endpoints';

const platformDetails: Record<
  string,
  { type: PlatformType; description: string }
> = {
  Docker: {
    type: PlatformType.Docker,
    description: 'Docker hosts and Swarm clusters',
  },
  Kubernetes: {
    type: PlatformType.Kubernetes,
    description: 'Kubernetes clusters and nodes',
  },
  Azure: { type: PlatformType.Azure, description: 'Azure Container Instances' },
  Podman: { type: PlatformType.Podman, description: 'Podman Containers' },
};

const healthDetails: Record<
  string,
  { type: EnvironmentHealth; description: string }
> = {
  Up: {
    type: EnvironmentHealth.Up,
    description: 'Environments online and up-to-date',
  },
  Down: {
    type: EnvironmentHealth.Down,
    description: 'Environments currently offline or unreachable',
  },
  Outdated: {
    type: EnvironmentHealth.Outdated,
    description: 'Environments with agents that can be upgraded',
  },
  Heartbeat: {
    type: EnvironmentHealth.Heartbeat,
    description: 'Edge environments with active heartbeat',
  },
};

const DEFAULT_PAGE_LIMIT = 100;

export function EnvironmentList({
  onClickBrowse,
  headerFilter = 'all',
  onHeaderFilterChange,
}: Props) {
  const isPureAdmin = useIsPureAdmin();
  const summaryQuery = useEnvironmentSummaryCounts();
  const { params } = useCurrentStateAndParams();
  const router = useRouter();

  const tableState = useGroupSortTableState(
    storageKey,
    'Group',
    DEFAULT_PAGE_LIMIT
  );

  const groupsQuery = useGroups();

  const sortKey = tableState.sortBy?.id ?? SORT_OPTIONS[0].key;
  const sortGroupFilter = tableState.groupBy;

  useUpdateEffect(() => {
    const derivedFilter = deriveHeaderFilter(sortKey, sortGroupFilter);
    // A named group filter (e.g. "Production") derives to 'all' because it has
    // no corresponding summary-bar button. Propagating 'all' here when there IS
    // still an active filter would cause applyHeaderFilter('all') to run and
    // immediately reset sortGroupFilter to null — wiping the user's selection.
    if (derivedFilter === 'all' && sortGroupFilter) return;
    onHeaderFilterChange?.(derivedFilter);
  }, [sortKey, sortGroupFilter, onHeaderFilterChange]);

  const baseQueryParams: EnvironmentsQueryParams = useBaseApiQueryParams(
    tableState.search
  );

  const sortGroupApiParams = useParseSortGroupApiParams(
    sortGroupFilter,
    sortKey,
    groupsQuery.data
  );

  const listQueryParams: EnvironmentsQueryParams = useMemo(
    () => ({ ...baseQueryParams, ...sortGroupApiParams }),
    [baseQueryParams, sortGroupApiParams]
  );

  const groupNameById = useMemo(
    () => new Map(groupsQuery.data?.map((g) => [g.Id, g.Name]) ?? []),
    [groupsQuery.data]
  );

  const availableGroupsBySort = useAvailableSortGroups(summaryQuery.data);

  const sortApiKey = getSortApiKey(sortKey);
  const sortOrder = tableState.sortBy?.desc ? 'desc' : 'asc';

  const { isLoading, environments, totalCount, updateAvailable } =
    useEnvironmentList(
      {
        page: tableState.page,
        pageLimit: tableState.pageSize,
        sort: sortApiKey,
        order: sortOrder,
        ...listQueryParams,
      },
      { refetchInterval: refetchIfAnyOffline }
    );

  const environmentRows = useMemo<EnvironmentRow[]>(() => {
    const rows = environments.map((env) => ({
      ...env,
      groupName: groupNameById.get(env.GroupId) ?? 'Unassigned',
      platformName:
        PlatformType[getPlatformType(env.Type, env.ContainerEngine)],
      healthLabel: getHealthLabel(env, sortGroupFilter),
    }));

    if (sortKey === 'Health') {
      rows.sort(
        (a, b) =>
          (HEALTH_SORT_ORDER[a.healthLabel] ?? HEALTH_SORT_ORDER.Unknown) -
          (HEALTH_SORT_ORDER[b.healthLabel] ?? HEALTH_SORT_ORDER.Unknown)
      );
    }

    return rows;
  }, [environments, groupNameById, sortKey, sortGroupFilter]);

  const isHeaderFilterFirstRender = useRef(true);
  useEffect(() => {
    if (isHeaderFilterFirstRender.current) {
      isHeaderFilterFirstRender.current = false;
      if (headerFilter === 'all') return;
    }
    applyHeaderFilter(headerFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the header filter value changes
  }, [headerFilter]);

  const isUrlParamInitDone = useRef(false);
  useEffect(() => {
    if (isUrlParamInitDone.current) return;
    isUrlParamInitDone.current = true;

    const groupByParam = params.groupBy as string | undefined;
    const filterParam = params.filter as string | undefined;

    if (!groupByParam) return;

    const sortKeyFromUrl =
      groupByParam.charAt(0).toUpperCase() + groupByParam.slice(1);
    const filterFromUrl = filterParam
      ? filterParam.charAt(0).toUpperCase() + filterParam.slice(1)
      : null;

    tableState.setSortBy(sortKeyFromUrl, false);
    tableState.setGroupBy(filterFromUrl);
    tableState.setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useUpdateEffect(() => {
    router.stateService.go(
      'portainer.home',
      {
        groupBy: sortKey.toLowerCase(),
        filter: sortGroupFilter ? sortGroupFilter.toLowerCase() : null,
      },
      { location: 'replace', inherit: true }
    );
  }, [sortKey, sortGroupFilter]);

  const headerButtons = [
    updateAvailable && <UpdateBadge key="update-badge" />,
    <KubeconfigButton
      key="kube-config-button"
      environments={environments}
      envQueryParams={listQueryParams}
    />,
  ].filter((btn): btn is React.ReactElement => Boolean(btn));

  return (
    <div className="flex flex-col gap-2">
      {summaryQuery.isSuccess && summaryQuery.data.total === 0 && (
        <NoEnvironmentsInfoPanel isAdmin={isPureAdmin} />
      )}
      <GroupSortTable
        data={environmentRows}
        isLoading={isLoading}
        columns={columns}
        renderRow={renderRow}
        getGroupKey={getGroupKey}
        renderGroupHeader={renderGroupHeader}
        getRowId={(item) => item.Id.toString()}
        tableState={tableState}
        sortOptions={SORT_OPTIONS}
        totalCount={totalCount}
        availableGroupsBySort={availableGroupsBySort}
        emptyContentLabel={{
          withSearch: 'No environments match your search',
          withoutSearch: 'No environments available.',
        }}
        loadingLabel="Loading..."
        searchPlaceholder="Search environments..."
        headerButtons={headerButtons}
        data-cy="home-endpointList"
      />
    </div>
  );

  function applyHeaderFilter(filter: string) {
    switch (filter) {
      case 'up':
        tableState.setSortBy('Health', false);
        tableState.setGroupBy('Up');
        tableState.setSearch('');
        break;
      case 'down':
        tableState.setSortBy('Health', false);
        tableState.setGroupBy('Down');
        tableState.setSearch('');
        break;
      case 'outdated':
        tableState.setSortBy('Health', false);
        tableState.setGroupBy('Outdated');
        tableState.setSearch('');
        break;
      case 'unassigned':
        tableState.setSortBy('Group', false);
        tableState.setGroupBy('1');
        tableState.setSearch('');
        break;
      case 'custom':
        break;
      default:
        // 'all' — do not clear the search term. This case is triggered both by
        // the user clicking "Total" and programmatically by the derived-filter
        // effect (e.g. when the user starts typing). Clearing here would wipe
        // the first character typed.
        //
        // Skip the reset when the current state already derives to 'all'. That
        // means the parent is echoing our own derived value back (e.g. after we
        // set sortGroupFilter='Heartbeat', which has no header-bar pill and
        // derives to 'all'). Without this guard, the echo would immediately
        // wipe a filter the user just selected.
        if (deriveHeaderFilter(sortKey, sortGroupFilter) !== 'all') {
          tableState.setGroupBy(null);
        }
        break;
    }
    tableState.setPage(1);
  }

  function renderRow(row: Row<EnvironmentRow>) {
    const env = row.original;
    return (
      <tr>
        <td colSpan={Number.MAX_SAFE_INTEGER} className="!p-0">
          <EnvironmentCard
            environment={env}
            groupName={env.groupName}
            onClickBrowse={() => onClickBrowse(env)}
          />
        </td>
      </tr>
    );
  }

  function renderGroupHeader(
    groupKey: string,
    count: number,
    groupLabel?: string
  ) {
    const sortId = (tableState.sortBy?.id ?? SORT_OPTIONS[0].key).trim();
    let icon: React.ReactElement;
    let description: string | undefined;

    if (sortId === 'Platform' && platformDetails[groupKey]) {
      icon = getPlatformIconByPlatform(platformDetails[groupKey].type, 'md');
      description = platformDetails[groupKey].description;
    } else if (sortId === 'Health' && healthDetails[groupKey]) {
      icon = getHealthIcon(healthDetails[groupKey].type, 'md');
      description = healthDetails[groupKey].description;
    } else {
      icon = getGroupIcon('md');
    }

    const hideCount = sortId === 'Health' && sortGroupFilter === null;

    return (
      <GroupSortTableGroupRow
        groupName={groupLabel || groupKey}
        groupDescription={description}
        groupIcon={icon}
        count={hideCount ? undefined : count}
      />
    );
  }
}

type EnvironmentRow = Environment & {
  groupName: string;
  platformName: string;
  healthLabel: string;
};

function getSortApiKey(sortBy: string): SortType {
  switch (sortBy) {
    case 'Platform':
      return 'PlatformType';
    case 'Health':
      return 'Status';
    default:
      return sortBy as SortType;
  }
}

function getHealthLabel(
  env: Environment,
  sortGroupFilter: string | null
): string {
  // When a health filter is applied the server only returns environments
  // matching that filter, so we trust the filter value as the label.
  if (sortGroupFilter !== null) {
    return sortGroupFilter;
  }

  const status = resolveBaseStatus(env);
  if (env.Agent.IsOutdated && status !== 'Down') {
    return 'Outdated';
  }
  return status;
}

function resolveBaseStatus(env: Environment): string {
  if (isEdgeEnvironment(env.Type)) {
    return env.Heartbeat ? 'Heartbeat' : 'Down';
  }
  switch (env.Status) {
    case EnvironmentStatus.Up:
      return 'Up';
    case EnvironmentStatus.Down:
      return 'Down';
    case EnvironmentStatus.Provisioning:
      return 'Provisioning';
    case EnvironmentStatus.Error:
      return 'Error';
    default:
      return 'Unknown';
  }
}

function getGroupKey(item: EnvironmentRow, sortBy: string): string {
  switch (sortBy) {
    case 'Group':
      return item.groupName;
    case 'Platform':
      return item.platformName;
    case 'Health':
      return item.healthLabel;
    default:
      return '';
  }
}

function deriveHeaderFilter(
  sortKey: string,
  sortGroupFilter: string | null
): HeaderFilter {
  if (!sortGroupFilter) return 'all';
  if (sortKey === 'Health') {
    if (sortGroupFilter === 'Up') return 'up';
    if (sortGroupFilter === 'Down') return 'down';
    if (sortGroupFilter === 'Outdated') return 'outdated';
  }
  if (sortKey === 'Group' && sortGroupFilter === '1') return 'unassigned';
  return 'custom';
}
