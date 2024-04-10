import { CellContext } from '@tanstack/react-table';

import { Authorized } from '@/react/hooks/useUser';
import { appOwnerLabel } from '@/react/kubernetes/applications/constants';

import { SystemBadge } from '@@/Badge/SystemBadge';
import { ExternalBadge } from '@@/Badge/ExternalBadge';
import { UnusedBadge } from '@@/Badge/UnusedBadge';
import { Link } from '@@/Link';

import { SecretRowData } from '../types';
import { configurationOwnerUsernameLabel } from '../../../constants';

import { columnHelper } from './helper';

export const name = columnHelper.accessor(
  (row) => {
    const name = row.metadata?.name;
    const isSystemToken = name?.includes('default-token-');

    const isRegistrySecret =
      row.metadata?.annotations?.['portainer.io/registry.id'];
    const isSystemSecret = isSystemToken || row.isSystem || isRegistrySecret;

    const hasConfigurationOwner = !!(
      row.metadata?.labels?.[configurationOwnerUsernameLabel] ||
      row.metadata?.labels?.[appOwnerLabel]
    );
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

  const isSystemToken = name?.includes('default-token-');
  const isSystemSecret = isSystemToken || row.original.isSystem;

  const hasConfigurationOwner = !!(
    row.original.metadata?.labels?.[configurationOwnerUsernameLabel] ||
    row.original.metadata?.labels?.[appOwnerLabel]
  );

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

        {isSystemSecret && <SystemBadge />}
        {!isSystemToken && !hasConfigurationOwner && <ExternalBadge />}
        {!row.original.inUse && !isSystemSecret && <UnusedBadge />}
      </div>
    </Authorized>
  );
}
