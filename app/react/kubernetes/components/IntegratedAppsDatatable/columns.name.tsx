import { CellContext } from '@tanstack/react-table';

import { Link } from '@@/Link';

import { helper } from './columns.helper';
import { IntegratedApp } from './types';

export const name = helper.accessor('Name', {
  header: 'Name',
  cell: Cell,
});

function Cell({ row: { original: item } }: CellContext<IntegratedApp, string>) {
  return (
    <Link
      to="kubernetes.applications.application"
      params={{ name: item.Name, namespace: item.ResourcePool }}
      data-cy={`application-link-${item.Name}`}
    >
      {item.Name}
    </Link>
  );
}
