import { CellContext } from '@tanstack/react-table';

import { isSystemNamespace } from '@/react/kubernetes/namespaces/utils';
import { Authorized } from '@/react/hooks/useUser';

import { Link } from '@@/Link';
import { Badge } from '@@/Badge';

import { SecretRowData } from '../types';

import { columnHelper } from './helper';

export const name = columnHelper.accessor(
  (row) => {
    const name = row.metadata?.name;
    const namespace = row.metadata?.namespace;

    const isSystemToken = name?.includes('default-token-');
    const isInSystemNamespace = namespace
      ? isSystemNamespace(namespace)
      : false;
    const isRegistrySecret =
      row.metadata?.annotations?.['portainer.io/registry.id'];
    const isSystemSecret =
      isSystemToken || isInSystemNamespace || isRegistrySecret;

    const hasConfigurationOwner =
      !!row.metadata?.labels?.['io.portainer.kubernetes.configuration.owner'];
    return `${name} ${isSystemSecret ? 'system' : ''} ${
      !isSystemToken && !hasConfigurationOwner ? 'external' : ''
    } ${!row.inUse && !isSystemSecret ? 'unused' : ''}`;
  },
  {
    header: 'Name',
    cell: Cell,
    id: 'name',
  }
);

function Cell({ row }: CellContext<SecretRowData, string>) {
  const name = row.original.metadata?.name;
  const namespace = row.original.metadata?.namespace;

  const isSystemToken = name?.includes('default-token-');
  const isInSystemNamespace = namespace ? isSystemNamespace(namespace) : false;
  const isSystemSecret = isSystemToken || isInSystemNamespace;

  const hasConfigurationOwner =
    !!row.original.metadata?.labels?.[
      'io.portainer.kubernetes.configuration.owner'
    ];

  return (
    <Authorized authorizations="K8sSecretsR" childrenUnauthorized={name}>
      <div className="flex w-fit">
        <Link
          to="kubernetes.secrets.secret"
          params={{
            namespace: row.original.metadata?.namespace,
            name,
          }}
          title={name}
          className="w-fit max-w-xs truncate xl:max-w-sm 2xl:max-w-md"
        >
          {name}
        </Link>
        {isSystemSecret && (
          <Badge type="success" className="ml-2">
            system
          </Badge>
        )}
        {!isSystemToken && !hasConfigurationOwner && (
          <Badge className="ml-2">external</Badge>
        )}
        {!row.original.inUse && !isSystemSecret && (
          <Badge type="warn" className="ml-2">
            unused
          </Badge>
        )}
      </div>
    </Authorized>
  );
}
