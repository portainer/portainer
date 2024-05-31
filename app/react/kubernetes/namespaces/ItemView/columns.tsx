import { createColumnHelper } from '@tanstack/react-table';
import _ from 'lodash';
import { useMemo } from 'react';

import { humanize, truncate } from '@/portainer/filters/filters';
import { usePublicSettings } from '@/react/portainer/settings/queries';

import { Link } from '@@/Link';
import { ExternalBadge } from '@@/Badge/ExternalBadge';

import { isExternalApplication } from '../../applications/utils';
import { cpuHumanValue } from '../../applications/utils/cpuHumanValue';

import { NamespaceApp } from './types';

const columnHelper = createColumnHelper<NamespaceApp>();

export function useColumns() {
  const hideStacksQuery = usePublicSettings<boolean>({
    select: (settings) =>
      settings.GlobalDeploymentOptions.hideStacksFunctionality,
  });

  return useMemo(
    () =>
      _.compact([
        columnHelper.accessor('Name', {
          header: 'Name',
          cell: ({ row: { original: item } }) => (
            <>
              <Link
                to="kubernetes.applications.application"
                params={{ name: item.Name, namespace: item.ResourcePool }}
                data-cy={`application-link-${item.Name}`}
              >
                {item.Name}
              </Link>
              {isExternalApplication({ metadata: item.Metadata }) && (
                <div className="ml-2">
                  <ExternalBadge />
                </div>
              )}
            </>
          ),
        }),
        !hideStacksQuery.data &&
          columnHelper.accessor('StackName', {
            header: 'Stack',
            cell: ({ getValue }) => getValue() || '-',
          }),
        columnHelper.accessor('Image', {
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
        columnHelper.accessor('CPU', {
          header: 'CPU',
          cell: ({ getValue }) => cpuHumanValue(getValue()),
        }),
        columnHelper.accessor('Memory', {
          header: 'Memory',
          cell: ({ getValue }) => humanize(getValue()),
        }),
      ]),
    [hideStacksQuery.data]
  );
}
