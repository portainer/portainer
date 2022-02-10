import { CellProps, Column } from 'react-table';
import { useSref } from '@uirouter/react';
import { MenuItem, MenuLink } from '@reach/menu-button';
import { useQueryClient } from 'react-query';

import { Device } from '@/portainer/hostmanagement/open-amt/model';
import { ActionsMenu } from '@/portainer/components/datatables/components/ActionsMenu';
import { confirmAsync } from '@/portainer/services/modal.service/confirm';
import { executeDeviceAction } from '@/portainer/hostmanagement/open-amt/open-amt.service';
import * as notifications from '@/portainer/services/notifications';
import { ActionsMenuTitle } from '@/portainer/components/datatables/components/ActionsMenuTitle';
import { useRowContext } from '@/edge/devices/components/AMTDevicesDatatable/columns/RowContext';
import { DeviceAction } from '@/edge/devices/types';

export const actions: Column<Device> = {
  Header: 'Actions',
  accessor: () => 'actions',
  id: 'actions',
  disableFilters: true,
  canHide: true,
  disableResizing: true,
  width: '5px',
  sortType: 'string',
  Filter: () => null,
  Cell: ActionsCell,
};

export function ActionsCell({ row: { original: device } }: CellProps<Device>) {
  const queryClient = useQueryClient();

  const { isLoading, toggleIsLoading, environmentId } = useRowContext();

  const kvmLinkProps = useSref('portainer.endpoints.endpoint.kvm', {
    id: environmentId,
    deviceId: device.guid,
    deviceName: device.hostname,
  });

  return (
    <ActionsMenu>
      <ActionsMenuTitle>AMT Functions</ActionsMenuTitle>
      <MenuItem
        disabled={isLoading}
        onSelect={() => handleDeviceActionClick(DeviceAction.PowerOn)}
      >
        Power ON
      </MenuItem>
      <MenuItem
        disabled={isLoading}
        onSelect={() => handleDeviceActionClick(DeviceAction.PowerOff)}
      >
        Power OFF
      </MenuItem>
      <MenuItem
        disabled={isLoading}
        onSelect={() => handleDeviceActionClick(DeviceAction.Restart)}
      >
        Restart
      </MenuItem>
      <MenuLink
        href={kvmLinkProps.href}
        onClick={kvmLinkProps.onClick}
        disabled={isLoading}
      >
        KVM
      </MenuLink>
    </ActionsMenu>
  );

  async function handleDeviceActionClick(action: string) {
    const confirmed = await confirmAsync({
      title: 'Confirm action',
      message: `Are you sure you want to ${action} the device?`,
      buttons: {
        cancel: {
          label: 'Cancel',
          className: 'btn-default',
        },
        confirm: {
          label: 'Confirm',
          className: 'btn-primary',
        },
      },
    });

    if (!confirmed) {
      return;
    }

    try {
      toggleIsLoading();
      await executeDeviceAction(environmentId, device.guid, action);
      notifications.success(
        `${action} action sent successfully`,
        device.hostname
      );
      await queryClient.invalidateQueries(['amt_devices', environmentId]);
    } catch (err) {
      notifications.error(
        'Failure',
        err as Error,
        `Failed to ${action} the device`
      );
    } finally {
      toggleIsLoading();
    }
  }
}
