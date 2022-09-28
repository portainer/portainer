import { ReactNode, useEffect, useState } from 'react';
import clsx from 'clsx';
import { RefreshCcw } from 'react-feather';
import _ from 'lodash';

import { usePaginationLimitState } from '@/portainer/hooks/usePaginationLimitState';
import {
  Environment,
  EnvironmentType,
  EnvironmentStatus,
  PlatformType,
  EdgeTypes,
} from '@/react/portainer/environments/types';
import { EnvironmentGroupId } from '@/portainer/environment-groups/types';
import {
  HomepageFilter,
  useHomePageFilter,
} from '@/portainer/home/HomepageFilter';
import { useDebounce } from '@/portainer/hooks/useDebounce';
import {
  refetchIfAnyOffline,
  useEnvironmentList,
} from '@/react/portainer/environments/queries/useEnvironmentList';
import { useGroups } from '@/portainer/environment-groups/queries';
import { useTags } from '@/portainer/tags/queries';
import { Filter } from '@/portainer/home/types';
import { useAgentVersionsList } from '@/react/portainer/environments/queries/useAgentVersionsList';
import { EnvironmentsQueryParams } from '@/react/portainer/environments/environment.service';
import { useUser } from '@/portainer/hooks/useUser';

import { TableFooter } from '@@/datatables/TableFooter';
import { TableActions, TableContainer, TableTitle } from '@@/datatables';
import { SortbySelector } from '@@/datatables/SortbySelector';
import {
  FilterSearchBar,
  useSearchBarState,
} from '@@/datatables/FilterSearchBar';
import { Button } from '@@/buttons';
import { PaginationControls } from '@@/PaginationControls';

import { EnvironmentItem } from './EnvironmentItem';
import { KubeconfigButton } from './KubeconfigButton';
import { NoEnvironmentsInfoPanel } from './NoEnvironmentsInfoPanel';
import styles from './EnvironmentList.module.css';

interface Props {
  onClickItem(environment: Environment): void;
  onRefresh(): void;
}

const status = [
  { value: EnvironmentStatus.Up, label: 'Up' },
  { value: EnvironmentStatus.Down, label: 'Down' },
];

const sortByOptions = [
  { value: 1, label: 'Name' },
  { value: 2, label: 'Group' },
  { value: 3, label: 'Status' },
];

enum ConnectionType {
  API,
  Agent,
  EdgeAgent,
  EdgeDevice,
}

const storageKey = 'home_endpoints';

export function EnvironmentList({ onClickItem, onRefresh }: Props) {
  const { isAdmin } = useUser();

  const [platformTypes, setPlatformTypes] = useHomePageFilter<
    Filter<PlatformType>[]
  >('platformType', []);
  const [searchBarValue, setSearchBarValue] = useSearchBarState(storageKey);
  const [pageLimit, setPageLimit] = usePaginationLimitState(storageKey);
  const [page, setPage] = useState(1);
  const debouncedTextFilter = useDebounce(searchBarValue);

  const [connectionTypes, setConnectionTypes] = useHomePageFilter<
    Filter<ConnectionType>[]
  >('connectionTypes', []);

  const [statusFilter, setStatusFilter] = useHomePageFilter<
    EnvironmentStatus[]
  >('status', []);
  const [tagFilter, setTagFilter] = useHomePageFilter<number[]>('tag', []);
  const [groupFilter, setGroupFilter] = useHomePageFilter<EnvironmentGroupId[]>(
    'group',
    []
  );
  const [sortByFilter, setSortByFilter] = useSearchBarState('sortBy');
  const [sortByDescending, setSortByDescending] = useHomePageFilter(
    'sortOrder',
    false
  );
  const [sortByButton, setSortByButton] = useHomePageFilter(
    'sortByButton',
    false
  );

  const [statusState, setStatusState] = useHomePageFilter<Filter[]>(
    'status_state',
    []
  );
  const [tagState, setTagState] = useHomePageFilter<Filter[]>('tag_state', []);
  const [groupState, setGroupState] = useHomePageFilter<Filter[]>(
    'group_state',
    []
  );
  const [sortByState, setSortByState] = useHomePageFilter<Filter | undefined>(
    'sort_by_state',
    undefined
  );
  const [agentVersions, setAgentVersions] = useHomePageFilter<Filter<string>[]>(
    'agentVersions',
    []
  );

  const groupsQuery = useGroups();

  const environmentsQueryParams: EnvironmentsQueryParams = {
    types: getTypes(
      platformTypes.map((p) => p.value),
      connectionTypes.map((p) => p.value)
    ),
    search: debouncedTextFilter,
    status: statusFilter,
    tagIds: tagFilter?.length ? tagFilter : undefined,
    groupIds: groupFilter,
    edgeDevice: false,
    tagsPartialMatch: true,
    agentVersions: agentVersions.map((a) => a.value),
  };

  const tagsQuery = useTags();

  const { isLoading, environments, totalCount, totalAvailable } =
    useEnvironmentList(
      {
        page,
        pageLimit,
        sort: sortByFilter,
        order: sortByDescending ? 'desc' : 'asc',
        ...environmentsQueryParams,
      },
      refetchIfAnyOffline
    );

  const agentVersionsQuery = useAgentVersionsList();

  useEffect(() => {
    setPage(1);
  }, [searchBarValue]);

  const groupOptions = [...(groupsQuery.data || [])];
  const uniqueGroup = [
    ...new Map(groupOptions.map((item) => [item.Id, item])).values(),
  ].map(({ Id: value, Name: label }) => ({
    value,
    label,
  }));

  const tagOptions = [...(tagsQuery.tags || [])];
  const uniqueTag = [
    ...new Map(tagOptions.map((item) => [item.ID, item])).values(),
  ].map(({ ID: value, Name: label }) => ({
    value,
    label,
  }));

  const connectionTypeOptions = getConnectionTypeOptions(platformTypes);
  const platformTypeOptions = getPlatformTypeOptions(connectionTypes);

  return (
    <>
      {totalAvailable === 0 && <NoEnvironmentsInfoPanel isAdmin={isAdmin} />}
      <div className="row">
        <div className="col-sm-12">
          <TableContainer>
            <TableTitle icon="hard-drive" featherIcon label="Environments" />

            <TableActions className={styles.actionBar}>
              <div className={styles.description}>
                Click on an environment to manage
              </div>
              <div className={styles.actionButton}>
                <div className={styles.refreshButton}>
                  {isAdmin && (
                    <Button
                      onClick={onRefresh}
                      data-cy="home-refreshEndpointsButton"
                      size="medium"
                      color="secondary"
                      className={clsx(
                        'vertical-center !ml-0',
                        styles.refreshEnvironmentsButton
                      )}
                    >
                      <RefreshCcw
                        className="feather icon-sm icon-white"
                        aria-hidden="true"
                      />
                      Refresh
                    </Button>
                  )}
                </div>
                <div className={styles.kubeconfigButton}>
                  <KubeconfigButton
                    environments={environments}
                    envQueryParams={{
                      ...environmentsQueryParams,
                      sort: sortByFilter,
                      order: sortByDescending ? 'desc' : 'asc',
                    }}
                  />
                </div>
                <div className={clsx(styles.filterSearchbar, 'ml-3')}>
                  <FilterSearchBar
                    value={searchBarValue}
                    onChange={setSearchBarValue}
                    placeholder="Search by name, group, tag, status, URL..."
                    data-cy="home-endpointsSearchInput"
                  />
                </div>
              </div>
            </TableActions>
            <div className={styles.filterContainer}>
              <div className={styles.filterLeft}>
                <HomepageFilter
                  filterOptions={platformTypeOptions}
                  onChange={setPlatformTypes}
                  placeHolder="Platform"
                  value={platformTypes}
                />
              </div>
              <div className={styles.filterLeft}>
                <HomepageFilter
                  filterOptions={connectionTypeOptions}
                  onChange={setConnectionTypes}
                  placeHolder="Connection Type"
                  value={connectionTypes}
                />
              </div>
              <div className={styles.filterLeft}>
                <HomepageFilter
                  filterOptions={status}
                  onChange={statusOnChange}
                  placeHolder="Status"
                  value={statusState}
                />
              </div>
              <div className={styles.filterLeft}>
                <HomepageFilter
                  filterOptions={uniqueTag}
                  onChange={tagOnChange}
                  placeHolder="Tags"
                  value={tagState}
                />
              </div>
              <div className={styles.filterLeft}>
                <HomepageFilter
                  filterOptions={uniqueGroup}
                  onChange={groupOnChange}
                  placeHolder="Groups"
                  value={groupState}
                />
              </div>
              <div className={styles.filterLeft}>
                <HomepageFilter<string>
                  filterOptions={
                    agentVersionsQuery.data?.map((v) => ({
                      label: v,
                      value: v,
                    })) || []
                  }
                  onChange={setAgentVersions}
                  placeHolder="Agent Version"
                  value={agentVersions}
                />
              </div>
              <button
                type="button"
                className={styles.clearButton}
                onClick={clearFilter}
              >
                Clear all
              </button>
              <div className={styles.filterRight}>
                <SortbySelector
                  filterOptions={sortByOptions}
                  onChange={sortOnchange}
                  onDescending={sortOnDescending}
                  placeHolder="Sort By"
                  sortByDescending={sortByDescending}
                  sortByButton={sortByButton}
                  value={sortByState}
                />
              </div>
            </div>
            <div className="blocklist" data-cy="home-endpointList">
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
                    onClick={onClickItem}
                  />
                ))
              )}
            </div>

            <TableFooter>
              <PaginationControls
                showAll={totalCount <= 100}
                pageLimit={pageLimit}
                page={page}
                onPageChange={setPage}
                totalCount={totalCount}
                onPageLimitChange={setPageLimit}
              />
            </TableFooter>
          </TableContainer>
        </div>
      </div>
    </>
  );

  function getTypes(
    platformTypes: PlatformType[],
    connectionTypes: ConnectionType[]
  ) {
    if (platformTypes.length === 0 && connectionTypes.length === 0) {
      return [];
    }

    const typesByPlatform = {
      [PlatformType.Docker]: [
        EnvironmentType.Docker,
        EnvironmentType.AgentOnDocker,
        EnvironmentType.EdgeAgentOnDocker,
      ],
      [PlatformType.Azure]: [EnvironmentType.Azure],
      [PlatformType.Kubernetes]: [
        EnvironmentType.KubernetesLocal,
        EnvironmentType.AgentOnKubernetes,
        EnvironmentType.EdgeAgentOnKubernetes,
      ],
    };

    const typesByConnection = {
      [ConnectionType.API]: [
        EnvironmentType.Azure,
        EnvironmentType.KubernetesLocal,
        EnvironmentType.Docker,
      ],
      [ConnectionType.Agent]: [
        EnvironmentType.AgentOnDocker,
        EnvironmentType.AgentOnKubernetes,
      ],
      [ConnectionType.EdgeAgent]: EdgeTypes,
      [ConnectionType.EdgeDevice]: EdgeTypes,
    };

    const selectedTypesByPlatform = platformTypes.flatMap(
      (platformType) => typesByPlatform[platformType]
    );
    const selectedTypesByConnection = connectionTypes.flatMap(
      (connectionType) => typesByConnection[connectionType]
    );

    if (selectedTypesByPlatform.length === 0) {
      return selectedTypesByConnection;
    }

    if (selectedTypesByConnection.length === 0) {
      return selectedTypesByPlatform;
    }

    return _.intersection(selectedTypesByConnection, selectedTypesByPlatform);
  }

  function statusOnChange(filterOptions: Filter[]) {
    setStatusState(filterOptions);
    if (filterOptions.length === 0) {
      setStatusFilter([]);
    } else {
      const filteredStatus = [
        ...new Set(
          filterOptions.map(
            (filterOptions: { value: number }) => filterOptions.value
          )
        ),
      ];
      setStatusFilter(filteredStatus);
    }
  }

  function groupOnChange(filterOptions: Filter[]) {
    setGroupState(filterOptions);
    if (filterOptions.length === 0) {
      setGroupFilter([]);
    } else {
      const filteredGroups = [
        ...new Set(
          filterOptions.map(
            (filterOptions: { value: number }) => filterOptions.value
          )
        ),
      ];
      setGroupFilter(filteredGroups);
    }
  }

  function tagOnChange(filterOptions: Filter[]) {
    setTagState(filterOptions);
    if (filterOptions.length === 0) {
      setTagFilter([]);
    } else {
      const filteredTags = [
        ...new Set(
          filterOptions.map(
            (filterOptions: { value: number }) => filterOptions.value
          )
        ),
      ];
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

  function sortOnchange(filterOptions: Filter) {
    if (filterOptions !== null) {
      setSortByFilter(filterOptions.label);
      setSortByButton(true);
      setSortByState(filterOptions);
    } else {
      setSortByFilter('');
      setSortByButton(true);
      setSortByState(undefined);
    }
  }

  function sortOnDescending() {
    setSortByDescending(!sortByDescending);
  }
}

function getConnectionTypeOptions(platformTypes: Filter<PlatformType>[]) {
  const platformTypeConnectionType = {
    [PlatformType.Docker]: [
      ConnectionType.API,
      ConnectionType.Agent,
      ConnectionType.EdgeAgent,
      ConnectionType.EdgeDevice,
    ],
    [PlatformType.Azure]: [ConnectionType.API],
    [PlatformType.Kubernetes]: [
      ConnectionType.Agent,
      ConnectionType.EdgeAgent,
      ConnectionType.EdgeDevice,
    ],
  };

  const connectionTypesDefaultOptions = [
    { value: ConnectionType.API, label: 'API' },
    { value: ConnectionType.Agent, label: 'Agent' },
    { value: ConnectionType.EdgeAgent, label: 'Edge Agent' },
  ];

  if (platformTypes.length === 0) {
    return connectionTypesDefaultOptions;
  }

  return _.compact(
    _.intersection(
      ...platformTypes.map((p) => platformTypeConnectionType[p.value])
    ).map((c) => connectionTypesDefaultOptions.find((o) => o.value === c))
  );
}

function getPlatformTypeOptions(connectionTypes: Filter<ConnectionType>[]) {
  const platformDefaultOptions = [
    { value: PlatformType.Docker, label: 'Docker' },
    { value: PlatformType.Azure, label: 'Azure' },
    { value: PlatformType.Kubernetes, label: 'Kubernetes' },
  ];

  if (connectionTypes.length === 0) {
    return platformDefaultOptions;
  }

  const connectionTypePlatformType = {
    [ConnectionType.API]: [PlatformType.Docker, PlatformType.Azure],
    [ConnectionType.Agent]: [PlatformType.Docker, PlatformType.Kubernetes],
    [ConnectionType.EdgeAgent]: [PlatformType.Kubernetes, PlatformType.Docker],
    [ConnectionType.EdgeDevice]: [PlatformType.Docker, PlatformType.Kubernetes],
  };

  return _.compact(
    _.intersection(
      ...connectionTypes.map((p) => connectionTypePlatformType[p.value])
    ).map((c) => platformDefaultOptions.find((o) => o.value === c))
  );
}

function renderItems(
  isLoading: boolean,
  totalCount: number,

  items: ReactNode
) {
  if (isLoading) {
    return (
      <div className="text-center text-muted" data-cy="home-loadingEndpoints">
        Loading...
      </div>
    );
  }

  if (!totalCount) {
    return (
      <div className="text-center text-muted" data-cy="home-noEndpoints">
        No environments available.
      </div>
    );
  }

  return items;
}
