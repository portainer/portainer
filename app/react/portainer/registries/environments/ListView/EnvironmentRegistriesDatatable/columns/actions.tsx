import { CellContext } from '@tanstack/react-table';
import { Users } from 'lucide-react';

import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { DecoratedRegistry } from '@/react/portainer/registries/ListView/RegistriesDatatable/types';
import { RegistryTypes } from '@/react/portainer/registries/types/registry';
import { columnHelper } from '@/react/portainer/registries/ListView/RegistriesDatatable/columns/helper';
import { BrowseButton } from '@/react/portainer/registries/ListView/RegistriesDatatable/columns/actions';

import { Button } from '@@/buttons';
import { Link } from '@@/Link';

export const actions = columnHelper.display({
  header: 'Actions',
  cell: Cell,
});

function Cell({
  row: { original: item },
}: CellContext<DecoratedRegistry, unknown>) {
  const environmentId = useEnvironmentId();
  const hasUpdateAccessAuthorizations = useAuthorizations(
    ['PortainerRegistryUpdateAccess'],
    environmentId,
    true
  );
  const canManageAccess =
    item.Type !== RegistryTypes.ANONYMOUS && hasUpdateAccessAuthorizations;

  if (!item.Id) {
    return null;
  }

  return (
    <>
      {canManageAccess && (
        <Authorized authorizations="PortainerRegistryUpdateAccess">
          <Button
            color="link"
            icon={Users}
            as={Link}
            props={{
              to: '.access',
              params: { id: item.Id },
            }}
            data-cy={`registry-manage-access-button-${item.Name}`}
          >
            Manage access
          </Button>
        </Authorized>
      )}
      <BrowseButton registry={item} environmentId={environmentId} />
    </>
  );
}
