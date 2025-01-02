import { CellContext, Column } from '@tanstack/react-table';
import { useSref } from '@uirouter/react';

import { truncate } from '@/portainer/filters/filters';
import { getValueAsArrayOfStrings } from '@/portainer/helpers/array';
import { ImagesListResponse } from '@/react/docker/images/queries/useImages';

import { MultipleSelectionFilter } from '@@/datatables/Filter';
import { UnusedBadge } from '@@/Badge/UnusedBadge';

import { columnHelper } from './helper';

export const id = columnHelper.accessor('id', {
  id: 'id',
  header: 'Id',
  cell: Cell,
  enableColumnFilter: true,
  filterFn: (
    { original: { used } },
    columnId,
    filterValue: Array<'Used' | 'Unused'>
  ) => {
    if (filterValue.length === 0) {
      return true;
    }

    if (filterValue.includes('Used') && used) {
      return true;
    }

    if (filterValue.includes('Unused') && !used) {
      return true;
    }

    return false;
  },
  meta: {
    filter: FilterByUsage,
  },
});

function FilterByUsage<TData extends { Used: boolean }>({
  column: { getFilterValue, setFilterValue, id },
}: {
  column: Column<TData>;
}) {
  const options = ['Used', 'Unused'];

  const value = getFilterValue();

  const valueAsArray = getValueAsArrayOfStrings(value);

  return (
    <MultipleSelectionFilter
      options={options}
      filterKey={id}
      value={valueAsArray}
      onChange={setFilterValue}
      menuTitle="Filter by usage"
    />
  );
}

function Cell({
  getValue,
  row: { original: image },
}: CellContext<ImagesListResponse, string>) {
  const name = getValue();

  const linkProps = useSref('.image', {
    id: image.id,
    imageId: image.id,
  });

  return (
    <div className="flex gap-1">
      <a href={linkProps.href} onClick={linkProps.onClick} title={name}>
        {truncate(name, 40)}
      </a>
      {!image.used && <UnusedBadge />}
    </div>
  );
}
