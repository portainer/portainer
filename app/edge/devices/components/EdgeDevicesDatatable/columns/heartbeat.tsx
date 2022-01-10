import {Column} from 'react-table';
import {Environment, EnvironmentStatus} from "Portainer/environments/types";
import {DefaultFilter} from 'Portainer/components/datatables/components/Filter';
import clsx from "clsx";

export const heartbeat: Column<Environment> = {
  Header: 'Heartbeat',
  accessor: (row) => row.Status === EnvironmentStatus.Up ? 'up' : 'down',
  id: 'status',
  Cell: StatusCell,
  Filter: DefaultFilter,
  canHide: true,
};

function StatusCell({ value: status }: { value: string }) {
  return (
      <span className={clsx('label', `label-${environmentStatusBadge(status)}`)}>
        {status}
    </span>
  );

  function environmentStatusBadge(status: string) {
    if (status === 'down') {
      return 'danger';
    }
    return 'success';
  }
}


