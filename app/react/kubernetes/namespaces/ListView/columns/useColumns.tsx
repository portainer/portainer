import _ from 'lodash';
import { useMemo } from 'react';

import { isoDate } from '@/portainer/filters/filters';
import { useAuthorizations } from '@/react/hooks/useUser';

import { Link } from '@@/Link';
import { StatusBadge } from '@@/StatusBadge';
import { Badge } from '@@/Badge';
import { SystemBadge } from '@@/Badge/SystemBadge';

import { helper } from './helper';
import { actions } from './actions';

export function useColumns() {
  const hasAuthQuery = useAuthorizations(
    'K8sResourcePoolsAccessManagementRW',
    undefined,
    true
  );
  return useMemo(
    () =>
      _.compact([
        helper.accessor('Namespace.Name', {
          header: 'Name',
          id: 'Name',
          cell: ({ getValue, row: { original: item } }) => {
            const name = getValue();

            return (
              <>
                <Link
                  to="kubernetes.resourcePools.resourcePool"
                  params={{
                    id: name,
                  }}
                >
                  {name}
                </Link>
                {item.Namespace.IsSystem && (
                  <span className="ml-2">
                    <SystemBadge />
                  </span>
                )}
              </>
            );
          },
        }),
        helper.accessor('Namespace.Status', {
          header: 'Status',
          cell({ getValue }) {
            const status = getValue();
            return <StatusBadge color={getColor(status)}>{status}</StatusBadge>;

            function getColor(status: string) {
              switch (status.toLowerCase()) {
                case 'active':
                  return 'success';
                case 'terminating':
                  return 'danger';
                default:
                  return 'info';
              }
            }
          },
        }),
        helper.accessor('Quota', {
          cell({ getValue }) {
            const quota = getValue();

            if (!quota) {
              return '-';
            }

            return <Badge type="warn">Enabled</Badge>;
          },
        }),
        helper.accessor('Namespace.CreationDate', {
          header: 'Created',
          cell({ row: { original: item } }) {
            return (
              <>
                {isoDate(item.Namespace.CreationDate)}{' '}
                {item.Namespace.ResourcePoolOwner
                  ? ` by ${item.Namespace.ResourcePoolOwner}`
                  : ''}
              </>
            );
          },
        }),
        hasAuthQuery.authorized && actions,
      ]),
    [hasAuthQuery.authorized]
  );
}
