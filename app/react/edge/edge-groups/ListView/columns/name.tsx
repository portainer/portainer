import { CellContext } from '@tanstack/react-table';

import i18n from '@/i18n';

import { Link } from '@@/Link';
import { Badge } from '@@/Badge';

import { EdgeGroupListItemResponse } from '../../queries/useEdgeGroups';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('Name', {
  header: () => i18n.t('edge.groups.columns.name'),
  cell: NameCell,
});

function NameCell({
  renderValue,
  row: { original: item },
}: CellContext<EdgeGroupListItemResponse, unknown>) {
  const name = renderValue() || '';

  if (typeof name !== 'string') {
    return null;
  }

  return (
    <>
      <Link
        to=".edit"
        params={{ groupId: item.Id }}
        title={name}
        data-cy={`edge-group-link-${name}`}
      >
        {name}
      </Link>
      {(item.HasEdgeJob || item.HasEdgeStack) && (
        <Badge type="info" className="ml-1">
          {i18n.t('edge.groups.in_use')}
        </Badge>
      )}
    </>
  );
}
