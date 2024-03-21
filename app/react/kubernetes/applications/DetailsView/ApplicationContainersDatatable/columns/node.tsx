import { Authorized } from '@/react/hooks/useUser';

import { Link } from '@@/Link';

import { columnHelper } from './helper';

export const node = columnHelper.accessor('nodeName', {
  header: 'Node',
  cell: ({ getValue }) => {
    const nodeName = getValue();
    return (
      <Authorized
        authorizations="K8sClusterNodeR"
        childrenUnauthorized={nodeName}
        adminOnlyCE
      >
        <Link
          to="kubernetes.cluster.node"
          params={{ nodeName }}
          data-cy={`application-container-node-${nodeName}`}
        >
          <div className="max-w-xs truncate" title={nodeName}>
            {nodeName}
          </div>
        </Link>
      </Authorized>
    );
  },
});
