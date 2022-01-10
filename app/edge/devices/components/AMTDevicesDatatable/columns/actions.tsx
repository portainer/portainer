import {CellProps, Column, TableInstance} from 'react-table';
import { Device } from "Portainer/hostmanagement/open-amt/model";
import { MenuItem } from "@reach/menu-button";
import { ActionsMenu } from "Portainer/components/datatables/components/ActionsMenu";
import {confirm} from "Portainer/services/modal.service/confirm";

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

export function ActionsCell({ row: { original: device }, }: CellProps<TableInstance>) {
  return (
      <ActionsMenu>
        <div className="tableActionsMenu">
          <div className="tableActionsHeader">AMT Functions</div>
          <div>
            <MenuItem onSelect={() => handlePowerOn()}>Power ON</MenuItem>
            <MenuItem onSelect={() => {}}>Power OFF</MenuItem>
            <MenuItem onSelect={() => {}}>Restart</MenuItem>
            <MenuItem onSelect={() => {}}>KVM</MenuItem>
          </div>

          <div className="tableActionsHeader">FDO Functions</div>
          <div>
            <MenuItem onSelect={() => {}}>Claim</MenuItem>
            <MenuItem onSelect={() => {}}>Provision</MenuItem>
          </div>
        </div>
      </ActionsMenu>
  )

  function handlePowerOn() {
    confirm({
      title: 'Confirm action',
      message: `Are you sure you want to power on the device?`,
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
        console.log(result);
        /*
        if (!result) {
          return;
        }

        try {
          setExecutingAction(deviceGUID, true);
          await executeDeviceAction(this.endpointId, deviceGUID, action);
          Notifications.success(`${action} action sent successfully`);
        } catch (err) {
          notifications.error('Failure', err as Error, `Failed to ${action} the device`);
        } finally {
          setLoadingMessage('');
        } */

      },
    });
  }

}
