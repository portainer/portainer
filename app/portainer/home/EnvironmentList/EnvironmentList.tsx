import { ReactNode, useEffect, useState } from 'react';
import clsx from 'clsx';

import { PaginationControls } from '@/portainer/components/pagination-controls';
import { usePaginationLimitState } from '@/portainer/hooks/usePaginationLimitState';
import {
  Environment,
  EnvironmentType,
  EnvironmentStatus,
} from '@/portainer/environments/types';
import { Button } from '@/portainer/components/Button';
import { useIsAdmin } from '@/portainer/hooks/useUser';
import {
  FilterSearchBar,
  useSearchBarState,
} from '@/portainer/components/datatables/components/FilterSearchBar';
import { SortbySelector } from '@/portainer/components/datatables/components/SortbySelector';
import { HomepageFilter } from '@/portainer/home/HomepageFilter';
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

export function EnvironmentList({ onClickItem, onRefresh }: Props) {
  const isAdmin = useIsAdmin();
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

  const [platformType, setPlatformType] = useState(allEnvironmentType);
  const [searchBarValue, setSearchBarValue] = useSearchBarState(storageKey);
  const [pageLimit, setPageLimit] = usePaginationLimitState(storageKey);
  const [page, setPage] = useState(1);
  const debouncedTextFilter = useDebounce(searchBarValue);

  const [statusFilter, setStatusFilter] = useState<number[]>([]);
  const [tagFilter, setTagFilter] = useState<number[]>([]);
  const [groupFilter, setGroupFilter] = useState<number[]>([]);
  const [sortByFilter, setSortByFilter] = useState<string>('');
  const [sortByDescending, setSortByDescending] = useState(false);
  const [sortByButton, setSortByButton] = useState(false);

  const [platformState, setPlatformState] = useState<Filter[]>([]);
  const [statusState, setStatusState] = useState<Filter[]>([]);
  const [tagState, setTagState] = useState<Filter[]>([]);
  const [groupState, setGroupState] = useState<Filter[]>([]);

  const groupsQuery = useGroups();

  const { isLoading, environments, totalCount, totalAvailable } =
    useEnvironmentList(
      { page, pageLimit, types: platformType, search: debouncedTextFilter },
      true
    );

  useEffect(() => {
    setPage(1);
  }, [searchBarValue]);

  interface Collection {
    Status: number[];
    TagIds: number[];
    GroupId: number[];
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

  const collection = {
    Status: statusFilter,
    TagIds: tagFilter,
    GroupId: groupFilter,
  };

  function multiPropsFilter(
    environments: Environment[],
    collection: Collection,
    sortByFilter: string,
    sortByDescending: boolean
  ) {
    const filterKeys = Object.keys(collection);
    const filterResult = environments.filter((environment: Environment) =>
      filterKeys.every((key) => {
        if (!collection[key as keyof Collection].length) return true;
        if (Array.isArray(environment[key as keyof Collection])) {
          return (environment[key as keyof Collection] as number[]).some(
            (keyEle) => collection[key as keyof Collection].includes(keyEle)
          );
        }
        return collection[key as keyof Collection].includes(
          environment[key as keyof Collection] as number
        );
      })
    );

    switch (sortByFilter) {
      case 'Name':
        return sortByDescending
          ? filterResult.sort((a, b) =>
              b.Name.toUpperCase() > a.Name.toUpperCase() ? 1 : -1
            )
          : filterResult.sort((a, b) =>
              a.Name.toUpperCase() > b.Name.toUpperCase() ? 1 : -1
            );
      case 'Group':
        return sortByDescending
          ? filterResult.sort((a, b) => b.GroupId - a.GroupId)
          : filterResult.sort((a, b) => a.GroupId - b.GroupId);
      case 'Status':
        return sortByDescending
          ? filterResult.sort((a, b) => b.Status - a.Status)
          : filterResult.sort((a, b) => a.Status - b.Status);
      case 'None':
        return filterResult;
      default:
        return filterResult;
    }
  }

  const filteredEnvironments: Environment[] = multiPropsFilter(
    environments,
    collection,
    sortByFilter,
    sortByDescending
  );

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

    let finalFilterEnvironment: number[] = [];

    if (filterOptions.length === 0) {
      setPlatformType(allEnvironmentType);
    } else {
      const filteredEnvironment = [
        ...new Set(
          filterOptions.map(
            (filterOptions: { value: number }) => filterOptions.value
          )
        ),
      ];
      if (filteredEnvironment.includes(dockerBaseType)) {
        finalFilterEnvironment = [...filteredEnvironment, ...dockerRelateType];
      }
      if (filteredEnvironment.includes(kubernetesBaseType)) {
        finalFilterEnvironment = [
          ...filteredEnvironment,
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
    setSearchBarValue('');
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
    } else {
      setSortByFilter('None');
      setSortByButton(false);
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

              {isAdmin && (
                <Button
                  onClick={onRefresh}
                  data-cy="home-refreshEndpointsButton"
                  className={clsx(styles.refreshEnvironmentsButton)}
                >
                  <i className="fa fa-sync space-right" aria-hidden="true" />
                  Refresh
                </Button>
              )}

              <KubeconfigButton environments={environments} />
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
              <div className={styles.filterLeft}>
                <FilterSearchBar
                  value={searchBarValue}
                  onChange={setSearchBarValue}
                  placeholder="Search...."
                  data-cy="home-endpointsSearchInput"
                />
              </div>
              <div className={styles.filterButton}>
                <Button size="medium" onClick={clearFilter}>
                  Clear
                </Button>
              </div>
              <div className={styles.filterRight}>
                <SortbySelector
                  filterOptions={SortByOptions}
                  onChange={sortOnchange}
                  onDescending={sortOndescending}
                  placeHolder="Sort By"
                  sortByDescending={sortByDescending}
                  sortByButton={sortByButton}
                />
              </div>
            </div>
            <div className="blocklist" data-cy="home-endpointList">
              {renderItems(
                isLoading,
                totalCount,
                filteredEnvironments.map((env) => (
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
