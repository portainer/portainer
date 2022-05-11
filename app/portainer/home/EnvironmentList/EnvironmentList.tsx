import { ReactNode, useEffect, useState } from 'react';
import clsx from 'clsx';

import { PaginationControls } from '@/portainer/components/pagination-controls';
import { usePaginationLimitState } from '@/portainer/hooks/usePaginationLimitState';
import {
  Environment,
  EnvironmentType,
  EnvironmentStatus,
} from '@/portainer/environments/types';
import { EnvironmentGroupId } from '@/portainer/environment-groups/types';
import { Button } from '@/portainer/components/Button';
import { useIsAdmin } from '@/portainer/hooks/useUser';
import {
  FilterSearchBar,
  useSearchBarState,
} from '@/portainer/components/datatables/components/FilterSearchBar';
import { SortbySelector } from '@/portainer/components/datatables/components/SortbySelector';
import {
  HomepageFilter,
  useHomePageFilter,
} from '@/portainer/home/HomepageFilter';
import {
  TableActions,
  TableContainer,
  TableTitle,
} from '@/portainer/components/datatables/components';
import { TableFooter } from '@/portainer/components/datatables/components/TableFooter';
import { useDebounce } from '@/portainer/hooks/useDebounce';
import { useEnvironmentList } from '@/portainer/environments/queries';
import { useGroups } from '@/portainer/environment-groups/queries';
import { useTags } from '@/portainer/tags/queries';
import { Filter } from '@/portainer/home/types';

import { EnvironmentItem } from './EnvironmentItem';
import { KubeconfigButton } from './KubeconfigButton';
import styles from './EnvironmentList.module.css';
import { NoEnvironmentsInfoPanel } from './NoEnvironmentsInfoPanel';

interface Props {
  onClickItem(environment: Environment): void;
  onRefresh(): void;
}

const PlatformOptions = [
  { value: EnvironmentType.Docker, label: 'Docker' },
  { value: EnvironmentType.Azure, label: 'Azure' },
  { value: EnvironmentType.KubernetesLocal, label: 'Kubernetes' },
];

const status = [
  { value: EnvironmentStatus.Up, label: 'Up' },
  { value: EnvironmentStatus.Down, label: 'Down' },
];

const SortByOptions = [
  { value: 1, label: 'Name' },
  { value: 2, label: 'Group' },
  { value: 3, label: 'Status' },
];

const storageKey = 'home_endpoints';
const allEnvironmentType = [
  EnvironmentType.Docker,
  EnvironmentType.AgentOnDocker,
  EnvironmentType.Azure,
  EnvironmentType.EdgeAgentOnDocker,
  EnvironmentType.KubernetesLocal,
  EnvironmentType.AgentOnKubernetes,
  EnvironmentType.EdgeAgentOnKubernetes,
];

export function EnvironmentList({ onClickItem, onRefresh }: Props) {
  const isAdmin = useIsAdmin();

  const [platformType, setPlatformType] = useHomePageFilter(
    'platformType',
    allEnvironmentType
  );
  const [searchBarValue, setSearchBarValue] = useSearchBarState(storageKey);
  const [pageLimit, setPageLimit] = usePaginationLimitState(storageKey);
  const [page, setPage] = useState(1);
  const debouncedTextFilter = useDebounce(searchBarValue);

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

  const [platformState, setPlatformState] = useHomePageFilter<Filter[]>(
    'type_state',
    []
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
    'sortby_state',
    undefined
  );

  const groupsQuery = useGroups();

  const { isLoading, environments, totalCount, totalAvailable } =
    useEnvironmentList(
      {
        page,
        pageLimit,
        types: platformType,
        search: debouncedTextFilter,
        status: statusFilter,
        tagIds: tagFilter?.length ? tagFilter : undefined,
        groupIds: groupFilter,
        sort: sortByFilter,
        order: sortByDescending ? 'desc' : 'asc',
        edgeDeviceFilter: 'none',
        tagsPartialMatch: true,
      },
      true
    );

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

  const alltags = useTags();
  const tagOptions = [...(alltags.tags || [])];
  const uniqueTag = [
    ...new Map(tagOptions.map((item) => [item.ID, item])).values(),
  ].map(({ ID: value, Name: label }) => ({
    value,
    label,
  }));

  function platformOnChange(filterOptions: Filter[]) {
    setPlatformState(filterOptions);
    const dockerBaseType = EnvironmentType.Docker;
    const kubernetesBaseType = EnvironmentType.KubernetesLocal;
    const dockerRelateType = [
      EnvironmentType.AgentOnDocker,
      EnvironmentType.EdgeAgentOnDocker,
    ];
    const kubernetesRelateType = [
      EnvironmentType.AgentOnKubernetes,
      EnvironmentType.EdgeAgentOnKubernetes,
    ];

    if (filterOptions.length === 0) {
      setPlatformType(allEnvironmentType);
    } else {
      let finalFilterEnvironment = filterOptions.map(
        (filterOption) => filterOption.value
      );
      if (finalFilterEnvironment.includes(dockerBaseType)) {
        finalFilterEnvironment = [
          ...finalFilterEnvironment,
          ...dockerRelateType,
        ];
      }
      if (finalFilterEnvironment.includes(kubernetesBaseType)) {
        finalFilterEnvironment = [
          ...finalFilterEnvironment,
          ...kubernetesRelateType,
        ];
      }
      setPlatformType(finalFilterEnvironment);
    }
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
    setPlatformState([]);
    setPlatformType(allEnvironmentType);
    setStatusState([]);
    setStatusFilter([]);
    setTagState([]);
    setTagFilter([]);
    setGroupState([]);
    setGroupFilter([]);
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

  function sortOndescending() {
    setSortByDescending(!sortByDescending);
  }

  return (
    <>
      {totalAvailable === 0 && <NoEnvironmentsInfoPanel isAdmin={isAdmin} />}
      <div className="row">
        <div className="col-sm-12">
          <TableContainer>
            <TableTitle icon="fa-plug" label="Environments" />

            <TableActions className={styles.actionBar}>
              <div className={styles.description}>
                <i className="fa fa-exclamation-circle blue-icon space-right" />
                Click on an environment to manage
              </div>
              <div className={styles.actionButton}>
                <div className={styles.refreshButton}>
                  {isAdmin && (
                    <Button
                      onClick={onRefresh}
                      data-cy="home-refreshEndpointsButton"
                      className={clsx(styles.refreshEnvironmentsButton)}
                    >
                      <i
                        className="fa fa-sync space-right"
                        aria-hidden="true"
                      />
                      Refresh
                    </Button>
                  )}
                </div>
                <div className={styles.kubeconfigButton}>
                  <KubeconfigButton environments={environments} />
                </div>
                <div className={styles.filterSearchbar}>
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
                  filterOptions={PlatformOptions}
                  onChange={platformOnChange}
                  placeHolder="Platform"
                  value={platformState}
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
              <button
                type="button"
                className={styles.clearButton}
                onClick={clearFilter}
              >
                Clear all
              </button>
              <div className={styles.filterRight}>
                <SortbySelector
                  filterOptions={SortByOptions}
                  onChange={sortOnchange}
                  onDescending={sortOndescending}
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
