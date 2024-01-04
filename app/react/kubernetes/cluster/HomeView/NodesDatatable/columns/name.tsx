import { CellContext } from '@tanstack/react-table';

import { Authorized } from '@/react/hooks/useUser';

import { Link } from '@@/Link';
import { Badge } from '@@/Badge';

import { NodeRowData } from '../types';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('Name', {
  header: 'Name',
  cell: NameCell,
});

function NameCell({
  row: { original: node },
}: CellContext<NodeRowData, string>) {
  const nodeName = node.metadata?.name;
  return (
    <div className="flex gap-2 whitespace-nowrap">
      <Authorized
        authorizations="K8sClusterNodeR"
        childrenUnauthorized={nodeName}
        adminOnlyCE
      >
        <Link to="kubernetes.cluster.node" params={{ nodeName }}>
          {nodeName}
        </Link>
      </Authorized>
      {node.isApi && <Badge type="info">api</Badge>}
      {node.isPublishedNode && <Badge type="success">environment IP</Badge>}
    </div>
  );
}
