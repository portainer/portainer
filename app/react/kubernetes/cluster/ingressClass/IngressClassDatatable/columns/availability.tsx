import { CellProps, Column } from 'react-table';
import { Check, X } from 'lucide-react';

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
      <Icon icon={value ? Check : X} className="!mr-1" />
      {value ? 'Allowed' : 'Disallowed'}
    </Badge>
  );
}
