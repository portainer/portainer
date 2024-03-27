import { CellContext } from '@tanstack/react-table';
import { Users } from 'lucide-react';

import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { Environment } from '@/react/portainer/environments/types';

import { Link } from '@@/Link';
import { Button } from '@@/buttons';

import { NamespaceViewModel } from '../types';
import { isDefaultNamespace } from '../../isDefaultNamespace';

import { helper } from './helper';

export const actions = helper.display({
  header: 'Actions',
  cell: Cell,
});

function Cell({
  row: { original: item },
}: CellContext<NamespaceViewModel, unknown>) {
  const environmentQuery = useCurrentEnvironment();

  if (!environmentQuery.data) {
    return null;
  }

  if (!canManageAccess(item, environmentQuery.data)) {
    return '-';
  }

  return (
    <Button
      as={Link}
      color="link"
      props={{
        to: 'kubernetes.resourcePools.resourcePool.access',
        params: { id: item.Namespace.Name },
      }}
      icon={Users}
    >
      Manage access
    </Button>
  );

  function canManageAccess(item: NamespaceViewModel, environment: Environment) {
    const name = item.Namespace.Name;
    const isSystem = item.Namespace.IsSystem;

    return (
      !isSystem &&
      (!isDefaultNamespace(name) ||
        environment.Kubernetes.Configuration.RestrictDefaultNamespace)
    );
  }
}
