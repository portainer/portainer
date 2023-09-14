import { columnHelper } from './helper';

export const slot = columnHelper.accessor((item) => item.Slot || '-', {
  header: 'Slot',
});
