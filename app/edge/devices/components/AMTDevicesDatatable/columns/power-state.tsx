import {CellProps, Column, TableInstance} from 'react-table';
import clsx from "clsx";
import { Device } from "Portainer/hostmanagement/open-amt/model";

import {useRowContext} from "@/edge/devices/components/AMTDevicesDatatable/columns/RowContext";

import styles from "../AMTDevices.module.css";

export const powerState: Column<Device> = {
  Header: 'Power State',
  accessor: (row) => parsePowerState(row.powerState),
  id: 'powerState',
  disableFilters: true,
  canHide: true,
  sortType: 'string',
  Cell: PowerStateCell,
  Filter: () => null,
};

export function PowerStateCell({ row: { original: device }, }: CellProps<TableInstance>) {
  const { isLoading } = useRowContext();
  return (
      <>
        <span className={clsx({'text-success': device.powerState === 2})}>
          {parsePowerState(device.powerState)}
        </span>
        <span>{isLoading && <i className={`fa fa-cog fa-spin ${styles.loadingSpinner}`} />}</span>
      </>
  )
}

function parsePowerState(value : number) {
  // https://app.swaggerhub.com/apis-docs/rbheopenamt/mps/1.4.0#/AMT/get_api_v1_amt_power_state__guid_
  switch (value) {
    case 2:
      return 'Running';
    case 3:
    case 4:
      return 'Sleep';
    case 6:
    case 8:
    case 13:
      return 'Off';
    case 7:
      return 'Hibernate';
    case 9:
      return 'Power Cycle';
    default:
      return '-';
  }
};
