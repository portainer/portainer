import { CellContext } from '@tanstack/react-table';
import { Users } from 'lucide-react';

import { EnvironmentStatus } from '@/react/portainer/environments/types';

import { Button } from '@@/buttons';
import { Link } from '@@/Link';

import { EnvironmentListItem } from '../types';

import { columnHelper } from './helper';

export const actions = columnHelper.display({
  header: 'Actions',
  cell: Cell,
});

function Cell({
  row: { original: environment },
}: CellContext<EnvironmentListItem, unknown>) {
  if (
    environment.Status === EnvironmentStatus.Provisioning ||
    environment.Status === EnvironmentStatus.Error
  ) {
    return <>-</>;
  }

  return (
    <Button
      as={Link}
      props={{
        to: 'portainer.endpoints.endpoint.access',
        params: { id: environment.Id },
      }}
      color="link"
      icon={Users}
      data-cy={`environment-manage-access-button-${environment.Name}`}
    >
      Manage access
    </Button>
  );
}
