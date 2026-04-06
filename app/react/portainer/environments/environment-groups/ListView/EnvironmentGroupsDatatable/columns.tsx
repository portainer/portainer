import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Users } from 'lucide-react';

import i18n from '@/i18n';

import { buildNameColumn } from '@@/datatables/buildNameColumn';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';

import { EnvironmentGroup } from '../../types';

const columnHelper = createColumnHelper<EnvironmentGroup>();

export const columns = [
  buildNameColumn<EnvironmentGroup>('Name', '.group', 'environment-group-name'),
  columnHelper.display({
    header: i18n.t('env_groups.col_actions') as string,
    cell: ActionsCell,
  }),
];

function ActionsCell({
  row: { original: item },
}: CellContext<EnvironmentGroup, unknown>) {
  return (
    <Button
      as={Link}
      props={{
        to: '.group.access',
        params: { id: item.Id },
      }}
      color="link"
      icon={Users}
      data-cy={`manage-access-button_${item.Name}`}
    >
      {i18n.t('env_groups.manage_access')}
    </Button>
  );
}
