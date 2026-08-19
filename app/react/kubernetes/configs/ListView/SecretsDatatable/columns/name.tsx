import { CellContext } from '@tanstack/react-table';

import { Authorized } from '@/react/hooks/useUser';

import { SystemBadge } from '@@/Badge/SystemBadge';
import { ExternalBadge } from '@@/Badge/ExternalBadge';
import { UnusedBadge } from '@@/Badge/UnusedBadge';
import { Link } from '@@/Link';
import { Tooltip } from '@@/Tip/Tooltip';

import { SecretRowData } from '../types';
import { RegistryBadge } from '../../../secrets/RegistryBadge';

import { columnHelper } from './helper';

export const name = columnHelper.accessor(
  (row) => {
    const name = row.Name;

    const isSystemToken = name?.includes('default-token-');
    const isSystemConfigMap = isSystemToken || row.isSystem;
    const hasConfigurationOwner = !!(
      row.ConfigurationOwner || row.ConfigurationOwnerId
    );
    return `${name} ${isSystemConfigMap ? 'system' : ''} ${
      !isSystemToken && !hasConfigurationOwner && !row.registryId
        ? 'external'
        : ''
    } ${!row.inUse && !isSystemConfigMap ? 'unused' : ''}`;
  },
  {
    header: 'Name',
    cell: Cell,
    id: 'name',
  }
);

function Cell({ row }: CellContext<SecretRowData, string>) {
  const name = row.original.Name;

  const isSystemToken = name?.includes('default-token-');
  const isSystemSecret = isSystemToken || row.original.isSystem;

  const hasConfigurationOwner = !!(
    row.original.ConfigurationOwner || row.original.ConfigurationOwnerId
  );

  return (
    <Authorized authorizations="K8sSecretsR" childrenUnauthorized={name}>
      <div className="flex gap-2">
        <Link
          to="kubernetes.secrets.secret"
          params={{
            namespace: row.original.Namespace,
            name,
          }}
          title={name}
          className="w-fit max-w-xs truncate xl:max-w-sm 2xl:max-w-md"
          data-cy={`secret-name-link-${name}`}
        >
          {name}
        </Link>
        <div className="ml-auto flex gap-2">
          {isSystemSecret && <SystemBadge />}
          {!isSystemToken &&
            !hasConfigurationOwner &&
            !row.original.registryId && <ExternalBadge />}
          {!row.original.inUse && !isSystemSecret && <UnusedBadge />}
          {row.original.registryId && (
            <RegistryBadge registryId={row.original.registryId}>
              <Tooltip message="This registry secret was created by Portainer to allow pulling images." />
            </RegistryBadge>
          )}
        </div>
      </div>
    </Authorized>
  );
}
