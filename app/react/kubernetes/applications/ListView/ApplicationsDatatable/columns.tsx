import { isoDate, truncate } from '@/portainer/filters/filters';

import { helper } from './columns.helper';

export const stackName = helper.accessor('StackName', {
  header: 'Stack',
  cell: ({ getValue }) => getValue() || '-',
});

export const namespace = helper.accessor('ResourcePool', {
  header: 'Namespace',
  cell: ({ getValue }) => getValue() || '-',
});

export const image = helper.accessor('Image', {
  header: 'Image',
  cell: ({ row: { original: item } }) => (
    <>
      {truncate(item.Image, 64)}
      {item.Containers && item.Containers?.length > 1 && (
        <>+ {item.Containers.length - 1}</>
      )}
    </>
  ),
});

export const appType = helper.accessor('ApplicationType', {
  header: 'Application Type',
});

export const published = helper.accessor('Services', {
  header: 'Published',
  cell: ({ row: { original: item } }) =>
    item.Services?.length === 0 ? 'No' : 'Yes',
  enableSorting: false,
});

export const created = helper.accessor('CreationDate', {
  header: 'Created',
  cell({ row: { original: item } }) {
    return (
      <>
        {isoDate(item.CreationDate)}{' '}
        {item.ApplicationOwner ? ` by ${item.ApplicationOwner}` : ''}
      </>
    );
  },
});
