import { CellContext } from '@tanstack/react-table';
import { BarChart } from 'lucide-react';

import { Link } from '@@/Link';
import { Icon } from '@@/Icon';

import { NodeRowData } from '../types';

import { columnHelper } from './helper';

export function getActions(metricsEnabled: boolean) {
  return columnHelper.accessor(() => '', {
    header: 'Actions',
    enableSorting: false,
    cell: (props) => (
      <ActionsCell
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        metricsEnabled={metricsEnabled}
      />
    ),
  });
}

function ActionsCell({
  row: { original: node },
  metricsEnabled,
}: CellContext<NodeRowData, string> & {
  metricsEnabled: boolean;
}) {
  const nodeName = node.metadata?.name;

  return (
    <div className="flex gap-1.5">
      {metricsEnabled && (
        <Link
          title="Stats"
          to="kubernetes.cluster.node.stats"
          params={{ nodeName }}
          className="flex items-center p-1"
          data-cy="nodeStatsButton"
        >
          <Icon icon={BarChart} />
        </Link>
      )}
    </div>
  );
}
