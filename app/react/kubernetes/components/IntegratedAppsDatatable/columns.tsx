import { truncate } from '@/portainer/filters/filters';

import { helper } from './columns.helper';
import { name } from './columns.name';

export const columns = [
  name,
  helper.accessor('StackName', {
    header: 'Stack',
    cell: ({ getValue }) => getValue() || '-',
  }),

  helper.accessor('Image', {
    header: 'Image',
    cell: ({ row: { original: item } }) => (
      <>
        {truncate(item.Image, 64)}
        {item.Containers?.length > 1 && <>+ {item.Containers.length - 1}</>}
      </>
    ),
  }),
];
