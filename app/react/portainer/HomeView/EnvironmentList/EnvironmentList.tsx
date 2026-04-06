import { ReactNode, useEffect, useState } from 'react';
import { HardDrive, RefreshCcw } from 'lucide-react';
import _ from 'lodash';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';

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
import { SortOption } from '@@/GroupSortTable/SortByGroup';
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
  { id: 'Age', accessorKey: 'age' },
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

const SORT_OPTIONS: SortOption[] = [
  {
    key: 'Age',
    label: 'Age',
    descendingLabel: 'Newest',
    ascendingLabel: 'Oldest',
  },
  { key: 'Group', label: 'Group', grouped: true },
  { key: 'Platform', label: 'Platform', grouped: true },
  { key: 'Health', label: 'Health', grouped: true },
];

const storageKey = 'home_endpoints';

export function EnvironmentList({ onClickBrowse, onRefresh }: Props) {
  const { t } = useTranslation();
  const currentEnvStore = useStore(environmentStore);
  const isPureAdmin = useIsPureAdmin();
  const summaryQuery = useEnvironmentSummaryCounts();
  const { params } = useCurrentStateAndParams();
  const router = useRouter();

  const tableState = useGroupSortTableState(
    storageKey,
    'Age',
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
      // Use Environment ID to sort age as lower ID = older environment
      age: env.Id,
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

      <TableContainer>
        <div className="px-4">
          <TableTitle
            className="!px-0"
            icon={HardDrive}
            label={t('home.environments')}
            description={
              <div className="w-full text-sm text-gray-7">
                {t('home.environments_description')}
              </div>
            }
          >
            <div className="flex items-center gap-4">
              <SearchBar
                className="!m-0 !min-w-[350px] !bg-transparent"
                value={searchBarValue}
                onChange={setSearchBarValue}
                placeholder={t('home.search_placeholder')}
                data-cy="home-endpointsSearchInput"
              />
              {isPureAdmin && (
                <Button
                  onClick={onRefresh}
                  data-cy="home-refreshEndpointsButton"
                  size="medium"
                  color="light"
                  icon={RefreshCcw}
                  className="!m-0"
                >
                  {t('common.refresh')}
                </Button>
              )}
              <KubeconfigButton
                environments={environments}
                envQueryParams={queryWithSort}
              />

              <AMTButton
                environments={environments}
                envQueryParams={queryWithSort}
              />

              {updateAvailable && <UpdateBadge />}
            </div>
          </TableTitle>
          <div className="-mt-3">
            <EnvironmentListFilters
              setPlatformTypes={setPlatformTypes}
              platformTypes={platformTypes}
              setConnectionTypes={setConnectionTypes}
              connectionTypes={connectionTypes}
              statusOnChange={statusOnChange}
              statusState={statusState}
              tagOnChange={tagOnChange}
              tagState={tagState}
              groupOnChange={groupOnChange}
              groupState={groupState}
              setAgentVersions={setAgentVersions}
              agentVersions={agentVersions}
              clearFilter={clearFilter}
              sortOnChange={sortOnchange}
              sortOnDescending={sortOnDescending}
              sortByDescending={sortByDescending}
              sortByButton={sortByButton}
              sortByState={sortByFilter}
            />
          </div>
          <div
            className="blocklist mt-5 !space-y-2 !p-0"
            data-cy="home-endpointList"
            role="list"
          >
            {renderItems(
              isLoading,
              totalCount,
              environments.map((env) => (
                <EnvironmentItem
                  key={env.Id}
                  environment={env}
                  groupName={
                    groupsQuery.data?.find((g) => g.Id === env.GroupId)?.Name
                  }
                  onClickBrowse={() => onClickBrowse(env)}
                  onClickDisconnect={() =>
                    env.Id === currentEnvStore.environmentId
                      ? currentEnvStore.clear()
                      : null
                  }
                  isActive={env.Id === currentEnvStore.environmentId}
                />
              )),
              t('common.loading'),
              t('home.no_environments')
            )}
          </div>
          <TableFooter className="!border-t-0">
            <PaginationControls
              className="!mr-0"
              showAll={totalCount <= 100}
              pageLimit={pageLimit}
              page={page}
              onPageChange={setPage}
              pageCount={Math.ceil(totalCount / pageLimit)}
              onPageLimitChange={setPageLimit}
            />
          </TableFooter>
        </div>
      </TableContainer>
    </>
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
    } else if (sortId === 'Age') {
      return null;
    } else {
      icon = getGroupIcon('md');
    }

    const hideCount = sortId === 'Health' && sortGroupFilter === null;

  function tagOnChange(value: number[]) {
    setTagState(value);
    if (value.length === 0) {
      setTagFilter([]);
    } else {
      const filteredTags = [...new Set(value)];
      setTagFilter(filteredTags);
    }
  }

  function clearFilter() {
    setPlatformTypes([]);
    setStatusState([]);
    setStatusFilter([]);
    setTagState([]);
    setTagFilter([]);
    setGroupState([]);
    setGroupFilter([]);
    setAgentVersions([]);
    setConnectionTypes([]);
  }

  function sortOnchange(value?: 'Name' | 'Group' | 'Status') {
    setSortByFilter(value);
    setSortByButton(!!value);
  }

  function sortOnDescending() {
    setSortByDescending(!sortByDescending);
  }
}

function renderItems(
  isLoading: boolean,
  totalCount: number,
  items: ReactNode,
  loadingText: string,
  noEnvText: string
) {
  if (isLoading) {
    return (
      <div className="text-muted text-center" data-cy="home-loadingEndpoints">
        {loadingText}
      </div>
    );
  }

  if (!totalCount) {
    return (
      <div className="text-muted text-center" data-cy="home-noEndpoints">
        {noEnvText}
      </div>
    );
  }

  return items;
}

type EnvironmentRow = Environment & {
  age: number;
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
