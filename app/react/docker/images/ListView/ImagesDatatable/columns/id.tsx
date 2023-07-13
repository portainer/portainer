import { CellContext, Column } from '@tanstack/react-table';
import { useSref } from '@uirouter/react';

import { DockerImage } from '@/react/docker/images/types';
import { truncate } from '@/portainer/filters/filters';
import { getValueAsArrayOfStrings } from '@/portainer/helpers/array';

import { MultipleSelectionFilter } from '@@/datatables/Filter';

import { columnHelper } from './helper';

export const id = columnHelper.accessor('Id', {
  id: 'id',
  header: 'Id',
  cell: Cell,
  enableColumnFilter: true,
  filterFn: (
    { original: { Used } },
    columnId,
    filterValue: Array<'Used' | 'Unused'>
  ) => {
    if (filterValue.length === 0) {
      return true;
    }

    if (filterValue.includes('Used') && Used) {
      return true;
    }

    if (filterValue.includes('Unused') && !Used) {
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
}: CellContext<DockerImage, string>) {
  const name = getValue();

  const linkProps = useSref('.image', {
    id: image.Id,
    imageId: image.Id,
  });

  return (
    <>
      <a href={linkProps.href} onClick={linkProps.onClick} title={name}>
        {truncate(name, 40)}
      </a>
      {!image.Used && (
        <span className="label label-warning image-tag ml-2">Unused</span>
      )}
    </>
  );
}
