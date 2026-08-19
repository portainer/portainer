import { CellContext, Column } from '@tanstack/react-table';

import { useIsEdgeAdmin } from '@/react/hooks/useUser';
import { getValueAsArrayOfStrings } from '@/portainer/helpers/array';
import { StackStatus } from '@/react/common/stacks/types';
import {
  isExternalStack,
  isOrphanedStack,
  isRegularStack,
} from '@/react/docker/stacks/view-models/utils';

import { Link } from '@@/Link';
import { MultipleSelectionFilter } from '@@/datatables/Filter';

import { DecoratedStack } from '../types';

import { columnHelper } from './helper';

const filterOptions = [
  'Active Stacks',
  'Inactive Stacks',
  'Deploying Stacks',
  'Error Stacks',
] as const;

type FilterOption = (typeof filterOptions)[number];

export const name = columnHelper.accessor('Name', {
  header: 'Name',
  id: 'name',
  cell: NameCell,
  enableHiding: false,
  enableColumnFilter: true,
  filterFn: (
    { original: stack },
    columnId,
    filterValue: Array<FilterOption>
  ) => {
    if (filterValue.length === 0) {
      return true;
    }

    if (isExternalStack(stack) || !stack.Status) {
      return true;
    }

    return (
      (stack.Status === StackStatus.Active &&
        filterValue.includes('Active Stacks')) ||
      (stack.Status === StackStatus.Inactive &&
        filterValue.includes('Inactive Stacks')) ||
      (stack.Status === StackStatus.Deploying &&
        filterValue.includes('Deploying Stacks')) ||
      (stack.Status === StackStatus.Error &&
        filterValue.includes('Error Stacks'))
    );
  },
  meta: {
    filter: Filter,
  },
});

function NameCell({
  row: { original: item },
}: CellContext<DecoratedStack, string>) {
  return (
    <>
      <NameLink item={item} />
      {isRegularStack(item) && item.Status === StackStatus.Inactive && (
        <span className="label label-warning image-tag space-left ml-2">
          Inactive
        </span>
      )}
      {isRegularStack(item) && item.Status === StackStatus.Deploying && (
        <span className="label label-info image-tag space-left ml-2">
          Deploying...
        </span>
      )}
      {isRegularStack(item) && item.Status === StackStatus.Error && (
        <span className="label label-danger image-tag space-left ml-2">
          Error
        </span>
      )}
    </>
  );
}

function NameLink({ item }: { item: DecoratedStack }) {
  const isAdminQuery = useIsEdgeAdmin();

  const name = item.Name;

  if (isExternalStack(item)) {
    return (
      <Link
        to="docker.stacks.stack"
        params={{
          name: item.Name,
          type: item.Type,
          external: true,
        }}
        title={name}
        data-cy="docker-external-stack-link"
      >
        {name}
      </Link>
    );
  }

  if (!isAdminQuery.isAdmin && isOrphanedStack(item)) {
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
      data-cy={`docker-stack-link-${item.Name}`}
    >
      {name}
    </Link>
  );
}

function Filter<TData extends { Used: boolean }>({
  column: { getFilterValue, setFilterValue, id },
}: {
  column: Column<TData>;
}) {
  const value = getFilterValue();

  const valueAsArray = getValueAsArrayOfStrings(value);

  return (
    <MultipleSelectionFilter
      options={filterOptions}
      filterKey={id}
      value={valueAsArray}
      onChange={setFilterValue}
      menuTitle="Filter by activity"
    />
  );
}
