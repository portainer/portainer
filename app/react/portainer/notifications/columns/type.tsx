import _ from 'lodash';

import { columnHelper } from './helper';

export const type = columnHelper.accessor('type', {
  header: 'Type',
  id: 'type',
  cell: ({ getValue }) => {
    const value = getValue();

    return _.capitalize(value);
  },
});
