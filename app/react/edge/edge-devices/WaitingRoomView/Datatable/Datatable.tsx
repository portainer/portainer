import { useStore } from 'zustand';

import { Environment } from '@/react/portainer/environments/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { Datatable as GenericDatatable } from '@@/datatables';
import { Button } from '@@/buttons';
import { TextTip } from '@@/Tip/TextTip';
import { createPersistedStore } from '@@/datatables/types';
import { useSearchBarState } from '@@/datatables/SearchBar';

import { useAssociateDeviceMutation, useLicenseOverused } from '../queries';

import { columns } from './columns';
import { Filter } from './Filter';
import { useEnvironments } from './useEnvironments';

const storageKey = 'edge-devices-waiting-room';

const settingsStore = createPersistedStore(storageKey, 'Name');

export function Datatable() {
  const associateMutation = useAssociateDeviceMutation();
  const licenseOverused = useLicenseOverused();
  const settings = useStore(settingsStore);
  const [search, setSearch] = useSearchBarState(storageKey);
  const { data: environments, totalCount, isLoading } = useEnvironments();

  return (
    <GenericDatatable
      columns={columns}
      dataset={environments}
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
      isLoading={isLoading}
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
