import { useMemo } from 'react';
import _ from 'lodash';

import { humanize, truncate } from '@/portainer/filters/filters';

import { Link } from '@@/Link';

import { helper } from './columns.helper';
import { name } from './columns.name';

export function useColumns(areStacksVisible: boolean) {
  return useMemo(
    () =>
      _.compact([
        name,
        areStacksVisible &&
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
                data-cy={`namespace-link-${namespace}`}
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
              {item.Containers?.length > 1 && (
                <>+ {item.Containers.length - 1}</>
              )}
            </>
          ),
        }),
        helper.accessor('CPU', {
          header: 'CPU reservation',
          cell: ({ getValue }) => _.round(getValue(), 2),
        }),
        helper.accessor('Memory', {
          header: 'Memory reservation',
          cell: ({ getValue }) => humanize(getValue()),
        }),
      ]),
    [areStacksVisible]
  );
}
