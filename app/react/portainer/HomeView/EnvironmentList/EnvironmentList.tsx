import { ReactNode, useEffect, useState } from 'react';
import { HardDrive, RefreshCcw } from 'lucide-react';
import _ from 'lodash';
import { useStore } from 'zustand';

import { usePaginationLimitState } from '@/react/hooks/usePaginationLimitState';
import {
  Environment,
  EnvironmentType,
  EnvironmentStatus,
  PlatformType,
  EdgeTypes,
} from '@/react/portainer/environments/types';
import { EnvironmentGroupId } from '@/react/portainer/environments/environment-groups/types';
import {
  refetchIfAnyOffline,
  useEnvironmentList,
} from '@/react/portainer/environments/queries/useEnvironmentList';
import { useGroups } from '@/react/portainer/environments/environment-groups/queries';
import { EnvironmentsQueryParams } from '@/react/portainer/environments/environment.service';
import { useIsPureAdmin } from '@/react/hooks/useUser';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { environmentStore } from '@/react/hooks/current-environment-store';

import { TableFooter } from '@@/datatables/TableFooter';
import { TableContainer, TableTitle } from '@@/datatables';
import { Button } from '@@/buttons';
import { PaginationControls } from '@@/PaginationControls';
import { SearchBar, useSearchBarState } from '@@/datatables/SearchBar';

import { useHomePageFilter } from './HomepageFilter';
import { ConnectionType } from './types';
import { EnvironmentItem } from './EnvironmentItem';
import { KubeconfigButton } from './KubeconfigButton';
import { NoEnvironmentsInfoPanel } from './NoEnvironmentsInfoPanel';
import { UpdateBadge } from './UpdateBadge';
import { EnvironmentListFilters } from './EnvironmentListFilters';
import { AMTButton } from './AMTButton/AMTButton';
import { ListSortType } from './SortbySelector';

interface Props {
  onClickBrowse(environment: Environment): void;
  onRefresh(): void;
}

const storageKey = 'home_endpoints';

export function EnvironmentList({ onClickBrowse, onRefresh }: Props) {
  const isPureAdmin = useIsPureAdmin();
  const currentEnvStore = useStore(environmentStore);

  const [platformTypes, setPlatformTypes] = useHomePageFilter<PlatformType[]>(
    'platformType',
    []
  );
  const [searchBarValue, setSearchBarValue] = useSearchBarState(storageKey);
  const [pageLimit, setPageLimit] = usePaginationLimitState(storageKey);
  const [page, setPage] = useState(1);

  const [connectionTypes, setConnectionTypes] = useHomePageFilter<
    ConnectionType[]
  >('connectionTypes', []);

  const [statusFilter, setStatusFilter] = useHomePageFilter<
    EnvironmentStatus[]
  >('status', []);
  const [tagFilter, setTagFilter] = useHomePageFilter<number[]>('tag', []);
  const [groupFilter, setGroupFilter] = useHomePageFilter<EnvironmentGroupId[]>(
    'group',
    []
  );
  const [sortByFilter, setSortByFilter] = useHomePageFilter<
    ListSortType | undefined
  >('sortBy', undefined);
  const [sortByDescending, setSortByDescending] = useHomePageFilter(
    'sortOrder',
    false
  );
  const [sortByButton, setSortByButton] = useHomePageFilter(
    'sortByButton',
    false
  );

  const [statusState, setStatusState] = useHomePageFilter<number[]>(
    'status_state',
    []
  );
  const [tagState, setTagState] = useHomePageFilter<number[]>('tag_state', []);
  const [groupState, setGroupState] = useHomePageFilter<number[]>(
    'group_state',
    []
  );

  const [agentVersions, setAgentVersions] = useHomePageFilter<string[]>(
    'agentVersions',
    []
  );

  const groupsQuery = useGroups();

  const environmentsQueryParams: EnvironmentsQueryParams = {
    types: getTypes(platformTypes, connectionTypes),
    search: searchBarValue,
    status: statusFilter,
    tagIds: tagFilter?.length ? tagFilter : undefined,
    groupIds: groupFilter,
    provisioned: true,
    tagsPartialMatch: true,
    agentVersions,
    updateInformation: isBE,
    edgeAsync: getEdgeAsyncValue(connectionTypes),
  };

  const queryWithSort = {
    ...environmentsQueryParams,
    sort: sortByFilter,
    order: sortByDescending ? 'desc' : ('asc' as 'desc' | 'asc'),
  };

  const {
    isLoading,
    environments,
    totalCount,
    totalAvailable,
    updateAvailable,
  } = useEnvironmentList(
    {
      page,
      pageLimit,
      ...queryWithSort,
    },
    { refetchInterval: refetchIfAnyOffline }
  );

  useEffect(() => {
    setPage(1);
  }, [searchBarValue]);

  return (
    <>
      {totalAvailable === 0 && (
        <NoEnvironmentsInfoPanel isAdmin={isPureAdmin} />
      )}

      <TableContainer>
        <div className="px-4">
          <TableTitle
            className="!px-0"
            icon={HardDrive}
            label="Environments"
            description={
              <div className="w-full text-sm text-gray-7">
                Click on an environment to manage
              </div>
            }
          >
            <div className="flex items-center gap-4">
              <SearchBar
                className="!m-0 !min-w-[350px] !bg-transparent"
                value={searchBarValue}
                onChange={setSearchBarValue}
                placeholder="Search by name, group, tag, status, URL..."
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
                  Refresh
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
              ))
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
      // for podman keep the env type as docker (the containerEngine distinguishes podman from docker)
      [PlatformType.Podman]: [
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
      [ConnectionType.EdgeAgentStandard]: EdgeTypes,
      [ConnectionType.EdgeAgentAsync]: EdgeTypes,
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

  function statusOnChange(value: number[]) {
    setStatusState(value);
    if (value.length === 0) {
      setStatusFilter([]);
    } else {
      const filteredStatus = [...new Set(value)];
      setStatusFilter(filteredStatus);
    }
  }

  function groupOnChange(value: number[]) {
    setGroupState(value);
    if (value.length === 0) {
      setGroupFilter([]);
    } else {
      const filteredGroups = [...new Set(value)];
      setGroupFilter(filteredGroups);
    }
  }

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

  items: ReactNode
) {
  if (isLoading) {
    return (
      <div className="text-muted text-center" data-cy="home-loadingEndpoints">
        Loading...
      </div>
    );
  }

  if (!totalCount) {
    return (
      <div className="text-muted text-center" data-cy="home-noEndpoints">
        No environments available.
      </div>
    );
  }

  return items;
}

function getEdgeAsyncValue(connectionTypes: ConnectionType[]) {
  const hasEdgeAsync = connectionTypes.some(
    (connectionType) => connectionType === ConnectionType.EdgeAgentAsync
  );

  const hasEdgeStandard = connectionTypes.some(
    (connectionType) => connectionType === ConnectionType.EdgeAgentStandard
  );

  // If both are selected, we don't want to filter on either, and same for if both are not selected
  if (hasEdgeAsync === hasEdgeStandard) {
    return undefined;
  }

  return hasEdgeAsync;
}
