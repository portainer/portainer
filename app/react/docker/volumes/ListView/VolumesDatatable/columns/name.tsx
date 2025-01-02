import { CellContext, Column } from '@tanstack/react-table';
import { Search } from 'lucide-react';

import { truncate } from '@/portainer/filters/filters';
import { getValueAsArrayOfStrings } from '@/portainer/helpers/array';
import { Authorized } from '@/react/hooks/useUser';

import { Button } from '@@/buttons';
import { Link } from '@@/Link';
import { MultipleSelectionFilter } from '@@/datatables/Filter';
import { UnusedBadge } from '@@/Badge/UnusedBadge';

import { DecoratedVolume } from '../../types';
import { getTableMeta } from '../tableMeta';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('Name', {
  id: 'name',
  header: 'Name',
  cell: Cell,
  enableColumnFilter: true,
  filterFn: (
    { original: { dangling } },
    columnId,
    filterValue: Array<'Used' | 'Unused'>
  ) => {
    if (filterValue.length === 0) {
      return true;
    }

    if (filterValue.includes('Used') && !dangling) {
      return true;
    }

    if (filterValue.includes('Unused') && dangling) {
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
  row: { original: item },
  table: {
    options: { meta },
  },
}: CellContext<DecoratedVolume, string>) {
  const { isBrowseVisible } = getTableMeta(meta);
  const name = getValue();

  return (
    <div className="flex gap-2">
      <Link
        to=".volume"
        params={{
          id: item.Name,
          nodeName: item.NodeName,
        }}
        data-cy={`volume-link-${name}`}
      >
        {truncate(name, 40)}
      </Link>
      {isBrowseVisible && (
        <Authorized authorizations="DockerAgentBrowseList">
          <Button
            className="ml-2"
            icon={Search}
            color="primary"
            size="xsmall"
            as={Link}
            props={{
              to: 'docker.volumes.volume.browse',
              params: {
                id: item.Name,
                nodeName: item.NodeName,
              },
            }}
            data-cy={`volume-browse-button-${name}`}
          >
            Browse
          </Button>
        </Authorized>
      )}
      {item.dangling && <UnusedBadge />}
    </div>
  );
}
