import { CellContext } from '@tanstack/react-table';

import { Link } from '@@/Link';

import { EdgeGroupListItemResponse } from '../../queries/useEdgeGroups';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('Name', {
  header: 'Name',
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
        <span className="label label-info image-tag space-left">in use</span>
      )}
    </>
  );
}
