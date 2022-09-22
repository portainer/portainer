import { CellProps, Column } from 'react-table';

import { Badge } from '@@/Badge';
import { Icon } from '@@/Icon';

import type { IngressControllerClassMap } from '../../types';

export const availability: Column<IngressControllerClassMap> = {
  Header: 'Availability',
  accessor: 'Availability',
  Cell: AvailailityCell,
  id: 'availability',
  disableFilters: true,
  canHide: true,
  sortInverted: true,
  sortType: 'basic',
  Filter: () => null,
};

function AvailailityCell({ value }: CellProps<IngressControllerClassMap>) {
  return (
    <Badge type={value ? 'success' : 'danger'}>
      <Icon icon={value ? 'check' : 'x'} feather className="!mr-1" />
      {value ? 'Allowed' : 'Disallowed'}
    </Badge>
  );
}
