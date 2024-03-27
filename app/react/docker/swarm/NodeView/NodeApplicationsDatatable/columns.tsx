import { humanize, truncate } from '@/portainer/filters/filters';
import { cpuValue } from '@/react/kubernetes/applications/utils/cpuValue';

import { Link } from '@@/Link';

import { helper } from './columns.helper';
import { name } from './columns.name';

export const columns = [
  name,
  helper.accessor('StackName', {
    header: 'Stack',
    cell: ({ getValue }) => getValue() || '-',
  }),
  helper.accessor((item) => item.ResourcePool, {
    header: 'Namespace',
    cell: ({ getValue }) => {
      const namespace = getValue();
      return (
        <Link
          to="kubernetes.resourcePools.resourcePool"
          params={{ id: namespace }}
        >
          {namespace}
        </Link>
      );
    },
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
  helper.accessor('CPU', {
    header: 'CPU reservation',
    cell: ({ getValue }) => cpuValue(getValue()),
  }),
  helper.accessor('Memory', {
    header: 'Memory reservation',
    cell: ({ getValue }) => humanize(getValue()),
  }),
];
