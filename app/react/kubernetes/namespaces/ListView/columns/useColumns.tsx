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
        helper.accessor('Name', {
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
                  data-cy={`namespace-link-${name}`}
                >
                  {name}
                </Link>
                {item.IsSystem && (
                  <span className="ml-2">
                    <SystemBadge />
                  </span>
                )}
              </>
            );
          },
        }),
        helper.accessor('Status', {
          header: 'Status',
          cell({ getValue }) {
            const status = getValue();
            return (
              <StatusBadge color={getColor(status.phase)}>
                {status.phase}
              </StatusBadge>
            );

            function getColor(status?: string) {
              switch (status?.toLowerCase()) {
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
        helper.accessor('ResourceQuota', {
          header: 'Quota',
          cell({ getValue }) {
            const quota = getValue();

            if (!quota) {
              return '-';
            }

            return <Badge type="warn">Enabled</Badge>;
          },
        }),
        helper.accessor('CreationDate', {
          header: 'Created',
          cell({ row: { original: item } }) {
            return (
              <>
                {isoDate(item.CreationDate)}{' '}
                {item.NamespaceOwner ? ` by ${item.NamespaceOwner}` : ''}
              </>
            );
          },
        }),
        hasAuthQuery.authorized && actions,
      ]),
    [hasAuthQuery.authorized]
  );
}
