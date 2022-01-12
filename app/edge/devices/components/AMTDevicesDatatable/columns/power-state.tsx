import { CellProps, Column, TableInstance } from 'react-table';
import clsx from 'clsx';

import { Device } from '@/portainer/hostmanagement/open-amt/model';
import { useRowContext } from '@/edge/devices/components/AMTDevicesDatatable/columns/RowContext';
import { PowerState, PowerStateCode } from '@/edge/devices/types';

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

export function PowerStateCell({
  row: { original: device },
}: CellProps<TableInstance>) {
  const { isLoading } = useRowContext();
  return (
    <>
      <span
        className={clsx({
          'text-success': device.powerState === PowerStateCode.ON,
        })}
      >
        {parsePowerState(device.powerState)}
      </span>
      <span>{isLoading && <i className="fa fa-cog fa-spin space-left" />}</span>
    </>
  );
}

function parsePowerState(value: number) {
  // https://app.swaggerhub.com/apis-docs/rbheopenamt/mps/1.4.0#/AMT/get_api_v1_amt_power_state__guid_
  switch (value) {
    case PowerStateCode.ON:
      return PowerState.RUNNING;
    case PowerStateCode.SLEEP_LIGHT:
    case PowerStateCode.SLEEP_DEEP:
      return PowerState.SLEEP;
    case PowerStateCode.OFF_HARD:
    case PowerStateCode.OFF_SOFT:
    case PowerStateCode.OFF_HARD_GRACEFUL:
      return PowerState.OFF;
    case PowerStateCode.HIBERNATE:
      return PowerState.HIBERNATE;
    case PowerStateCode.POWER_CYCLE:
      return PowerState.POWER_CYCLE;
    default:
      return '-';
  }
}
