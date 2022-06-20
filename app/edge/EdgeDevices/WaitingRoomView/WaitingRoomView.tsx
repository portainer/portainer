import { useRouter } from '@uirouter/react';

import { useEnvironmentList } from '@/portainer/environments/queries/useEnvironmentList';
import { r2a } from '@/react-tools/react2angular';

import { TableSettingsProvider } from '@@/datatables/useTableSettings';
import { PageHeader } from '@@/PageHeader';

import { DataTable } from './Datatable/Datatable';
import { TableSettings } from './Datatable/types';

export function WaitingRoomView() {
  const storageKey = 'edge-devices-waiting-room';
  const router = useRouter();
  const { environments, isLoading, totalCount } = useEnvironmentList({
    edgeDeviceFilter: 'untrusted',
  });

  if (process.env.PORTAINER_EDITION !== 'BE') {
    router.stateService.go('edge.devices');
    return null;
  }

  return (
    <>
      <PageHeader
        title="Waiting Room"
        breadcrumbs={[
          { label: 'Edge Devices', link: 'edge.devices' },
          { label: 'Waiting Room' },
        ]}
      />
      <TableSettingsProvider<TableSettings>
        defaults={{ pageSize: 10, sortBy: { desc: false, id: 'name' } }}
        storageKey={storageKey}
      >
        <DataTable
          devices={environments}
          totalCount={totalCount}
          isLoading={isLoading}
          storageKey={storageKey}
        />
      </TableSettingsProvider>
    </>
  );
}

export const WaitingRoomViewAngular = r2a(WaitingRoomView, []);
