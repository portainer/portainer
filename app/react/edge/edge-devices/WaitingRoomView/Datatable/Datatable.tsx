import { useStore } from 'zustand';
import _ from 'lodash';

import { EdgeTypes, Environment } from '@/react/portainer/environments/types';
import { notifySuccess } from '@/portainer/services/notifications';
import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { useGroups } from '@/react/portainer/environments/environment-groups/queries';
import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';
import { useTags } from '@/portainer/tags/queries';
import { HomepageFilter } from '@/react/portainer/HomeView/EnvironmentList/HomepageFilter';

import { Datatable as GenericDatatable } from '@@/datatables';
import { Button } from '@@/buttons';
import { TextTip } from '@@/Tip/TextTip';
import { createPersistedStore } from '@@/datatables/types';
import { useSearchBarState } from '@@/datatables/SearchBar';

import { useAssociateDeviceMutation, useLicenseOverused } from '../queries';
import { WaitingRoomEnvironment } from '../types';

import { columns } from './columns';
import { useFilterStore } from './filter-store';

const storageKey = 'edge-devices-waiting-room';

const settingsStore = createPersistedStore(storageKey, 'Name');

export function Datatable() {
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

  const { environments, isLoading, totalCount } = useEnvironmentList({
    edgeDeviceUntrusted: true,
    excludeSnapshots: true,
    types: EdgeTypes,
    tagIds: filterStore.tags.length ? filterStore.tags : undefined,
    groupIds: filterStore.groups.length ? filterStore.groups : undefined,
    endpointIds: filterByEnvironmentsIds,
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

  const associateMutation = useAssociateDeviceMutation();
  const licenseOverused = useLicenseOverused();
  const settings = useStore(settingsStore);
  const [search, setSearch] = useSearchBarState(storageKey);

  const waitingRoomEnvironments: Array<WaitingRoomEnvironment> =
    environments.map((env) => ({
      ...env,
      Group: groupsQuery.data?.[env.GroupId] || '',
      EdgeGroups:
        environmentEdgeGroupsQuery.data?.[env.Id]?.map((env) => env.group) ||
        [],
      Tags:
        _.compact(env.TagIds?.map((tagId) => tagsQuery.data?.[tagId])) || [],
    }));

  return (
    <GenericDatatable
      columns={columns}
      dataset={waitingRoomEnvironments}
      initialPageSize={settings.pageSize}
      onPageSizeChange={settings.setPageSize}
      initialSortBy={settings.sortBy}
      onSortByChange={settings.setSortBy}
      searchValue={search}
      onSearchChange={setSearch}
      title="Edge Devices Waiting Room"
      emptyContentLabel="No Edge Devices found"
      renderTableActions={(selectedRows) => (
        <>
          <Button
            onClick={() => handleAssociateDevice(selectedRows)}
            disabled={selectedRows.length === 0}
          >
            Associate Device
          </Button>

          {licenseOverused ? (
            <div className="ml-2 mt-2">
              <TextTip color="orange">
                Associating devices is disabled as your node count exceeds your
                license limit
              </TextTip>
            </div>
          ) : null}
        </>
      )}
      isLoading={
        isLoading ||
        groupsQuery.isLoading ||
        environmentEdgeGroupsQuery.isLoading ||
        tagsQuery.isLoading
      }
      totalCount={totalCount}
      description={<Filter />}
    />
  );

  function handleAssociateDevice(devices: Environment[]) {
    associateMutation.mutate(
      devices.map((d) => d.Id),
      {
        onSuccess() {
          notifySuccess('Success', 'Edge devices associated successfully');
        },
      }
    );
  }
}

function Filter() {
  const edgeGroupsQuery = useEdgeGroups();
  const groupsQuery = useGroups();
  const tagsQuery = useTags();

  const filterStore = useFilterStore();

  if (!edgeGroupsQuery.data || !groupsQuery.data || !tagsQuery.data) {
    return null;
  }

  return (
    <div className="flex w-full gap-5 [&>*]:w-1/5">
      <HomepageFilter
        onChange={(f) => filterStore.setEdgeGroups(f)}
        placeHolder="Edge groups"
        value={filterStore.edgeGroups}
        filterOptions={edgeGroupsQuery.data.map((g) => ({
          label: g.Name,
          value: g.Id,
        }))}
      />
      <HomepageFilter
        onChange={(f) => filterStore.setGroups(f)}
        placeHolder="Group"
        value={filterStore.groups}
        filterOptions={groupsQuery.data.map((g) => ({
          label: g.Name,
          value: g.Id,
        }))}
      />
      <HomepageFilter
        onChange={(f) => filterStore.setTags(f)}
        placeHolder="Tags"
        value={filterStore.tags}
        filterOptions={tagsQuery.data.map((g) => ({
          label: g.Name,
          value: g.ID,
        }))}
      />
    </div>
  );
}
