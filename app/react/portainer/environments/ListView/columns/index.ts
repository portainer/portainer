import { actions } from './actions';
import { columnHelper } from './helper';
import { name } from './name';
import { type } from './type';
import { url } from './url';

export const columns = [
  name,
  type,
  url,
  columnHelper.accessor('GroupName', {
    header: 'Group Name',
  }),
  actions,
];
