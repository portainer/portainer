import { CellContext, Column } from '@tanstack/react-table';
import { Search } from 'lucide-react';

import { truncate } from '@/portainer/filters/filters';
import { getValueAsArrayOfStrings } from '@/portainer/helpers/array';
import { Authorized, useCurrentUser } from '@/react/hooks/useUser';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';

import { Button } from '@@/buttons';
import { Link } from '@@/Link';
import { MultipleSelectionFilter } from '@@/datatables/Filter';

import { DecoratedVolume } from '../../types';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('Id', {
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
}: CellContext<DecoratedVolume, string>) {
  const isBrowseVisible = useIsBrowseAllowed();
  const name = getValue();

  return (
    <>
      <Link
        to=".volume"
        params={{
          id: item.Id,
          nodeName: item.NodeName,
        }}
        className="monospaced"
      >
        {truncate(name, 40)}
      </Link>
      {isBrowseVisible && (
        <Authorized authorizations="DockerAgentBrowseList">
          <Button icon={Search} color="primary" size="xsmall" as={Link}>
            browse
          </Button>
        </Authorized>
      )}
      {item.dangling && (
        <span className="label label-warning image-tag ml-2">Unused</span>
      )}
    </>
  );
}

function useIsBrowseAllowed() {
  const environmentQuery = useCurrentEnvironment();
  const { isAdmin } = useCurrentUser();
  const env = environmentQuery.data;

  return (
    !!env &&
    isAgentEnvironment(env.Type) &&
    (isAdmin || env.SecuritySettings.allowVolumeBrowserForRegularUsers)
  );
}
