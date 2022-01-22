import { CellProps, Column } from 'react-table';
import clsx from 'clsx';

import { Environment, EnvironmentStatus } from '@/portainer/environments/types';
import { useRowContext } from '@/edge/devices/components/EdgeDevicesDatatable/columns/RowContext';

export const heartbeat: Column<Environment> = {
  Header: 'Heartbeat',
  accessor: 'Status',
  id: 'status',
  Cell: StatusCell,
  disableFilters: true,
  canHide: true,
};

export function StatusCell({
  row: { original: environment },
}: CellProps<Environment>) {
  const { disableTrustOnFirstConnect } = useRowContext();

  if (disableTrustOnFirstConnect && !environment.UserTrusted) {
    return <span className="label label-default">untrusted</span>;
  }

  if (!environment.LastCheckInDate) {
    return (
      <span className="label label-default">
        <s>associated</s>
      </span>
    );
  }

  return (
    <i
      className={clsx(
        'fa',
        'fa-heartbeat',
        environmentStatusLabel(environment.Status)
      )}
      aria-hidden="true"
    />
  );

  function environmentStatusLabel(status: EnvironmentStatus) {
    if (status === EnvironmentStatus.Up) {
      return 'green-icon';
    }
    return 'orange-icon';
  }
}
