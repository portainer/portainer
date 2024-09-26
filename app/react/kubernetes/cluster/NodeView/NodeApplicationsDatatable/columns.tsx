import _ from 'lodash';
import { useMemo } from 'react';

import { humanize, truncate } from '@/portainer/filters/filters';
import { usePublicSettings } from '@/react/portainer/settings/queries';

import { Link } from '@@/Link';

import { helper } from './columns.helper';
import { name } from './columns.name';

export function useColumns() {
  const hideStacksQuery = usePublicSettings<boolean>({
    select: (settings) =>
      settings.GlobalDeploymentOptions.hideStacksFunctionality,
  });

  return useMemo(
    () =>
      _.compact([
        name,
        !hideStacksQuery.data &&
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
          cell: ({ row: { original: item } }) => {
            const containersLength = item.Containers?.length || 0;
            return (
              <>
                {truncate(item.Image, 64)}
                {containersLength > 1 && <>+ {containersLength - 1}</>}
              </>
            );
          },
        }),
        helper.accessor((row) => row.Resource?.CpuRequest, {
          header: 'CPU reservation',
          cell: ({ getValue }) => <>{_.round(getValue() || 0, 2)}</>,
        }),
        helper.accessor((row) => row.Resource?.CpuLimit, {
          header: 'CPU Limit',
          cell: ({ getValue }) => <>{_.round(getValue() || 0, 2)}</>,
        }),
        helper.accessor((row) => row.Resource?.MemoryRequest, {
          header: 'Memory reservation',
          cell: ({ getValue }) => <>{humanize(getValue() || 0)}</>,
        }),
        helper.accessor((row) => row.Resource?.MemoryLimit, {
          header: 'Memory Limit',
          cell: ({ getValue }) => <>{humanize(getValue() || 0)}</>,
        }),
      ]),
    [hideStacksQuery.data]
  );
}
