import { EnvironmentId } from '@/react/portainer/environments/types';
import PortainerError from '@/portainer/error';

import { NestedDatatable } from '@@/datatables/NestedDatatable';

import { useAMTDevices } from './useAMTDevices';
import { columns } from './columns';

export interface AMTDevicesTableProps {
  environmentId: EnvironmentId;
}

export function AMTDevicesDatatable({ environmentId }: AMTDevicesTableProps) {
  const devicesQuery = useAMTDevices(environmentId);

  return (
    <NestedDatatable
      columns={columns}
      dataset={devicesQuery.devices}
      isLoading={devicesQuery.isLoading}
      emptyContentLabel={userMessage(devicesQuery.error)}
      defaultSortBy="hostname"
    />
  );
}

function userMessage(error?: PortainerError) {
  if (error) {
    return error.message;
  }

  return 'No devices found';
}
