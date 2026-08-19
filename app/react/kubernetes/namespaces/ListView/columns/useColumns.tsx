import _ from 'lodash';
import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

import { isoDate } from '@/portainer/filters/filters';
import { useAuthorizations } from '@/react/hooks/useUser';
import { pluralize } from '@/portainer/helpers/strings';

import { Link } from '@@/Link';
import { StatusBadge } from '@@/StatusBadge';
import { Badge } from '@@/Badge';
import { SystemBadge } from '@@/Badge/SystemBadge';
import { Icon } from '@@/Icon';

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
              <div className="flex gap-2">
                <Link
                  to="kubernetes.resourcePools.resourcePool"
                  params={{
                    id: name,
                  }}
                  data-cy={`namespace-link-${name}`}
                >
                  {name}
                </Link>
                {item.IsSystem && <SystemBadge className="ml-auto" />}
              </div>
            );
          },
        }),
        helper.accessor('Status', {
          header: 'Status',
          cell({ getValue, row: { original: item } }) {
            const status = getValue();
            return (
              <div className="flex items-center gap-2">
                <StatusBadge color={getColor(status.phase)}>
                  {status.phase}
                </StatusBadge>
                {item.UnhealthyEventCount > 0 && (
                  <span className="inline-flex">
                    <Badge type="warnSecondary">
                      <Icon icon={AlertTriangle} className="!mr-1 h-3 w-3" />
                      <Link
                        to="kubernetes.resourcePools.resourcePool"
                        params={{ id: item.Name, tab: 'events' }}
                        data-cy={`namespace-warning-link-${item.Name}`}
                        // use the badge text and hover color
                        className="!text-inherit hover:text-inherit"
                        title="View events"
                      >
                        {item.UnhealthyEventCount}{' '}
                        {pluralize(item.UnhealthyEventCount, 'warning')}
                      </Link>
                    </Badge>
                  </span>
                )}
              </div>
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
