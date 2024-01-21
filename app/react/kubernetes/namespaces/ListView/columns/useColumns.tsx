import _ from 'lodash';
import { useMemo } from 'react';
import clsx from 'clsx';

import { isoDate } from '@/portainer/filters/filters';
import { useAuthorizations } from '@/react/hooks/useUser';
import KubernetesNamespaceHelper from '@/kubernetes/helpers/namespaceHelper';

import { Link } from '@@/Link';

import { helper } from './helper';
import { actions } from './actions';

export function useColumns() {
  const hasAuth = useAuthorizations('K8sResourcePoolsAccessManagementRW');
  return useMemo(
    () =>
      _.compact([
        helper.accessor('Namespace.Name', {
          header: 'Name',
          id: 'Name',
          cell: ({ getValue }) => {
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
                {KubernetesNamespaceHelper.isSystemNamespace(name) && (
                  <span className="label label-info image-tag ml-2">
                    system
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
            return (
              <span className={clsx('label', getLabelClass(status))}>
                {status}
              </span>
            );

            function getLabelClass(status: string) {
              switch (status.toLowerCase()) {
                case 'active':
                  return 'label-success';
                case 'terminating':
                  return 'label-danger';
                default:
                  return 'label-primary';
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

            return <span className="label label-warning">Enabled</span>;
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
        hasAuth && actions,
      ]),
    [hasAuth]
  );
}
