import { CellContext, createColumnHelper } from '@tanstack/react-table';

import { useCurrentUser } from '@/react/hooks/useUser';

import { Link } from '@@/Link';

import { isExternalStack, isRegularStack } from '../../view-models/utils';

import { DecoratedStack } from './types';

const columnHelper = createColumnHelper<DecoratedStack>();

export const columns = [
  columnHelper.accessor('Name', {
    header: 'Name',
    id: 'name',
    cell: NameCell,
  }),
];

function NameCell({
  row: { original: item },
}: CellContext<DecoratedStack, string>) {
  return (
    <>
      <NameLink item={item} />
      {isRegularStack(item) && item.Status === 2 && (
        <span className="label label-warning image-tag space-left ml-2">
          Inactive
        </span>
      )}
    </>
  );
}

function NameLink({ item }: { item: DecoratedStack }) {
  const { isAdmin } = useCurrentUser();

  const name = item.Name;

  if (!isExternalStack(item)) {
    if (!isAdmin && item.Orphaned) {
      return <>{name}</>;
    }

    return (
      <Link
        to="docker.stacks.stack"
        params={{
          name: item.Name,
          id: item.Id,
          type: item.Type,
          regular: item.Regular,
          orphaned: item.Orphaned,
          orphanedRunning: item.OrphanedRunning,
        }}
        title={name}
      >
        {name}
      </Link>
    );
  }

  return (
    <Link
      to="docker.stacks.stack"
      params={{
        name: item.Name,
        id: item.Id,
        type: item.Type,
        external: item.External,
      }}
      title={name}
    >
      {name}
    </Link>
  );
}
