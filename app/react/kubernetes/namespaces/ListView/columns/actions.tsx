import { CellContext } from '@tanstack/react-table';
import { Users } from 'lucide-react';

import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { Environment } from '@/react/portainer/environments/types';

import { Link } from '@@/Link';
import { Button } from '@@/buttons';

import { isDefaultNamespace } from '../../isDefaultNamespace';
import { PortainerNamespace } from '../../types';

import { helper } from './helper';

export const actions = helper.display({
  header: 'Actions',
  cell: Cell,
});

function Cell({
  row: { original: namespace },
}: CellContext<PortainerNamespace, unknown>) {
  const environmentQuery = useCurrentEnvironment();

  if (!environmentQuery.data) {
    return null;
  }

  if (!canManageAccess(namespace, environmentQuery.data)) {
    return '-';
  }

  return (
    <Button
      as={Link}
      color="link"
      props={{
        to: 'kubernetes.resourcePools.resourcePool.access',
        params: {
          id: namespace.Name,
        },
      }}
      icon={Users}
      data-cy={`manage-access-button-${namespace.Name}`}
    >
      Manage access
    </Button>
  );

  function canManageAccess(
    { Name, IsSystem }: PortainerNamespace,
    environment: Environment
  ) {
    return (
      !IsSystem &&
      (!isDefaultNamespace(Name) ||
        environment.Kubernetes.Configuration.RestrictDefaultNamespace)
    );
  }
}
