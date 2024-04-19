import { CellContext } from '@tanstack/react-table';

import { useIsEdgeAdmin } from '@/react/hooks/useUser';

import { Link } from '@@/Link';

import { DecoratedRegistry } from '../types';

import { columnHelper } from './helper';
import { DefaultRegistryName } from './DefaultRegistryName';

export const name = columnHelper.accessor('Name', {
  header: 'Name',
  cell: Cell,
});

function Cell({
  row: { original: item },
}: CellContext<DecoratedRegistry, string>) {
  return <NameCell item={item} hasLink />;
}

export function NameCell({
  item,
  hasLink,
}: {
  item: DecoratedRegistry;
  hasLink?: boolean;
}) {
  const isEdgeAdminQuery = useIsEdgeAdmin();

  if (!item.Id) {
    return <DefaultRegistryName />;
  }

  return (
    <>
      {isEdgeAdminQuery.isAdmin && hasLink ? (
        <Link
          to="portainer.registries.registry"
          params={{ id: item.Id }}
          data-cy={`registry-link-${item.Name}`}
        >
          {item.Name}
        </Link>
      ) : (
        item.Name
      )}
      {item.Authentication && (
        <span className="ml-2 label label-info image-tag">
          authentication-enabled
        </span>
      )}
    </>
  );
}
