import { CellProps, Column, TableInstance } from 'react-table';
import { useRouter } from '@uirouter/react';
import { MenuItem } from '@reach/menu-button';

import styles from '@/portainer/components/datatables/components/ActionsMenu.module.css'
import { Device } from '@/portainer/hostmanagement/open-amt/model';
import { ActionsMenu } from '@/portainer/components/datatables/components/ActionsMenu';
import { confirm } from '@/portainer/services/modal.service/confirm';
import { useEnvironment } from '@/portainer/environments/useEnvironment';
import { executeDeviceAction } from '@/portainer/hostmanagement/open-amt/open-amt.service';
import * as notifications from '@/portainer/services/notifications';
import { useRowContext } from '@/edge/devices/components/AMTDevicesDatatable/columns/RowContext';


export const actions: Column<Device> = {
  Header: 'Actions',
  accessor: () => 'actions',
  id: 'actions',
  disableFilters: true,
  canHide: true,
  sortType: 'string',
  Filter: () => null,
  Cell: ActionsCell,
};

export function ActionsCell({
  row: { original: device },
}: CellProps<TableInstance>) {
  const router = useRouter();
  const environment = useEnvironment();
  const { isLoading, toggleIsLoading } = useRowContext();

  return (
    <ActionsMenu>
      <div className={styles.tableActionsMenu}>
        <div className={styles.tableActionsHeader}>AMT Functions</div>
        <div>
          <MenuItem
            disabled={isLoading}
            onSelect={() => handleDeviceActionClick('power on')}
          >
            Power ON
          </MenuItem>
          <MenuItem
            disabled={isLoading}
            onSelect={() => handleDeviceActionClick('power off')}
          >
            Power OFF
          </MenuItem>
          <MenuItem
            disabled={isLoading}
            onSelect={() => handleDeviceActionClick('restart')}
          >
            Restart
          </MenuItem>
          <MenuItem disabled={isLoading} onSelect={() => handleKVMClick()}>
            KVM
          </MenuItem>
        </div>
      </div>
    </ActionsMenu>
  );

  function handleDeviceActionClick(action: string) {
    confirm({
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
      callback: async (result: boolean) => {
        if (!result) {
          return;
        }

        try {
          toggleIsLoading();
          await executeDeviceAction(environment.Id, device.guid, action);
          notifications.success(
            `${action} action sent successfully`,
            device.hostname
          );
          await router.stateService.reload();
        } catch (err) {
          notifications.error(
            'Failure',
            err as Error,
            `Failed to ${action} the device`
          );
          toggleIsLoading();
        }
      },
    });
  }

  function handleKVMClick() {
    router.stateService.go('portainer.endpoints.endpoint.kvm', {
      id: environment.Id,
      deviceId: device.guid,
      deviceName: device.hostname,
    });
  }
}
