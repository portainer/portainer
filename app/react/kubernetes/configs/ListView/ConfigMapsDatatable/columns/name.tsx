import { CellContext } from '@tanstack/react-table';

import { Authorized } from '@/react/hooks/useUser';
import { appOwnerLabel } from '@/react/kubernetes/applications/constants';

import { Link } from '@@/Link';
import { Badge } from '@@/Badge';

import { ConfigMapRowData } from '../types';
import { configurationOwnerUsernameLabel } from '../../../constants';

import { columnHelper } from './helper';

export const name = columnHelper.accessor(
  (row) => {
    const name = row.metadata?.name;

    const isSystemToken = name?.includes('default-token-');
    const isSystemConfigMap = isSystemToken || row.isSystem;

    const hasConfigurationOwner = !!(
      row.metadata?.labels?.[configurationOwnerUsernameLabel] ||
      row.metadata?.labels?.[appOwnerLabel]
    );

    return `${name} ${isSystemConfigMap ? 'system' : ''} ${
      !isSystemToken && !hasConfigurationOwner ? 'external' : ''
    } ${!row.inUse && !isSystemConfigMap ? 'unused' : ''}`;
  },
  {
    header: 'Name',
    cell: Cell,
    id: 'name',
  }
);

function Cell({ row }: CellContext<ConfigMapRowData, string>) {
  const name = row.original.metadata?.name;

  const isSystemToken = name?.includes('default-token-');
  const isSystemConfigMap = isSystemToken || row.original.isSystem;

  const hasConfigurationOwner =
    !!row.original.metadata?.labels?.[
      'io.portainer.kubernetes.configuration.owner'
    ];

  return (
    <Authorized authorizations="K8sConfigMapsR" childrenUnauthorized={name}>
      <div className="flex">
        <Link
          to="kubernetes.configmaps.configmap"
          params={{
            namespace: row.original.metadata?.namespace,
            name,
          }}
          title={name}
          className="w-fit max-w-xs truncate xl:max-w-sm 2xl:max-w-md"
        >
          {name}
        </Link>
        {isSystemConfigMap && (
          <Badge type="success" className="ml-2">
            System
          </Badge>
        )}
        {!isSystemToken && !hasConfigurationOwner && (
          <Badge className="ml-2">External</Badge>
        )}
        {!row.original.inUse && !isSystemConfigMap && (
          <Badge type="warn" className="ml-2">
            Unused
          </Badge>
        )}
      </div>
    </Authorized>
  );
}
