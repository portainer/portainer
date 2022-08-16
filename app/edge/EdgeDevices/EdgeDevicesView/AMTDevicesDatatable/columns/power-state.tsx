import { CellProps, Column } from 'react-table';
import clsx from 'clsx';

import { Device } from '@/portainer/hostmanagement/open-amt/model';

import { useRowContext } from './RowContext';

enum PowerState {
  Running = 'Running',
  Sleep = 'Sleep',
  Off = 'Off',
  Hibernate = 'Hibernate',
  PowerCycle = 'Power Cycle',
}

enum PowerStateCode {
  On = 2,
  SleepLight = 3,
  SleepDeep = 4,
  OffHard = 6,
  Hibernate = 7,
  OffSoft = 8,
  PowerCycle = 9,
  OffHardGraceful = 13,
}

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
