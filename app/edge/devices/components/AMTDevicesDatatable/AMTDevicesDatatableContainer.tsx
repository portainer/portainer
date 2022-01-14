import { useAMTDevices } from '@/edge/devices/components/AMTDevicesDatatable/useAMTDevices';
import { EnvironmentId } from '@/portainer/environments/types';
import { AMTDevicesDatatable } from '@/edge/devices/components/AMTDevicesDatatable/AMTDevicesDatatable';
import { RowProvider } from '@/edge/devices/components/AMTDevicesDatatable/columns/RowContext';

export interface AMTDevicesTableContainerProps {
  environmentId: EnvironmentId;
}

export function AMTDevicesDatatableContainer({
  environmentId,
}: AMTDevicesTableContainerProps) {
  const { isLoading, devices, error } = useAMTDevices(environmentId);

  return (
    <RowProvider environmentId={environmentId}>
      <AMTDevicesDatatable
        devices={devices}
        isLoading={isLoading}
        error={error}
      />
    </RowProvider>
  );
}
