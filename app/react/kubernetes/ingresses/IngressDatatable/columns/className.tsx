import { Column } from 'react-table';

import { Ingress } from '../../types';

export const className: Column<Ingress> = {
  Header: 'Class Name',
  accessor: 'ClassName',
  id: 'className',
  disableFilters: true,
  canHide: true,
};
