import { CellProps, Column } from 'react-table';
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
}: CellProps<Device>) {
  const { isLoading } = useRowContext();
  return (
    <>
      <span
        className={clsx({
          'text-success': device.powerState === PowerStateCode.On,
        })}
      >
        {parsePowerState(device.powerState)}
      </span>
      <span>{isLoading && <i className="fa fa-cog fa-spin space-left" />}</span>
    </>
  );
}

function parsePowerState(value: PowerStateCode) {
  // https://app.swaggerhub.com/apis-docs/rbheopenamt/mps/1.4.0#/AMT/get_api_v1_amt_power_state__guid_
  switch (value) {
    case PowerStateCode.On:
      return PowerState.Running;
    case PowerStateCode.SleepLight:
    case PowerStateCode.SleepDeep:
      return PowerState.Sleep;
    case PowerStateCode.OffHard:
    case PowerStateCode.OffSoft:
    case PowerStateCode.OffHardGraceful:
      return PowerState.Off;
    case PowerStateCode.Hibernate:
      return PowerState.Hibernate;
    case PowerStateCode.PowerCycle:
      return PowerState.PowerCycle;
    default:
      return '-';
  }
}
