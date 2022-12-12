import { CellProps, Column } from 'react-table';
import clsx from 'clsx';

import { Environment } from '@/react/portainer/environments/types';
import { useHasHeartbeat } from '@/react/edge/hooks/useHasHeartbeat';

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
  return <EdgeIndicator environment={environment} />;
}

function EdgeIndicator({ environment }: { environment: Environment }) {
  const isValid = useHasHeartbeat(environment);

  if (isValid === null) {
    return null;
  }

  const associated = !!environment.EdgeID;
  if (!associated) {
    return (
      <span role="status" aria-label="edge-status">
        <span className="label label-default" aria-label="unassociated">
          <s>associated</s>
        </span>
      </span>
    );
  }

  return (
    <span role="status" aria-label="edge-status">
      <span
        className={clsx('label', {
          'label-danger': !isValid,
          'label-success': isValid,
        })}
        aria-label="edge-heartbeat"
      >
        heartbeat
      </span>
    </span>
  );
}
