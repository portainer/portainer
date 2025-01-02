import { createColumnHelper } from '@tanstack/react-table';
import _ from 'lodash';
import { useMemo } from 'react';

import { usePublicSettings } from '@/react/portainer/settings/queries';
import { humanize } from '@/portainer/filters/filters';

import { Link } from '@@/Link';
import { ExternalBadge } from '@@/Badge/ExternalBadge';

import { isExternalApplication } from '../../applications/utils';
import { cpuHumanValue } from '../../applications/utils/cpuHumanValue';
import { Application } from '../../applications/ListView/ApplicationsDatatable/types';

const columnHelper = createColumnHelper<Application>();

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
            <div className="flex flex-0">
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
            </div>
          ),
        }),
        !hideStacksQuery.data &&
          columnHelper.accessor('StackName', {
            header: 'Stack',
            cell: ({ getValue }) => getValue() || '-',
          }),
        columnHelper.accessor('Image', {
          header: 'Image',
          cell: ({ getValue }) => (
            <div className="max-w-md truncate">{getValue()}</div>
          ),
        }),
        columnHelper.accessor(
          (row) =>
            row.Resource?.CpuRequest
              ? cpuHumanValue(row.Resource?.CpuRequest)
              : '-',
          {
            header: 'CPU',
            cell: ({ getValue }) => getValue(),
          }
        ),
        columnHelper.accessor(
          (row) =>
            row.Resource?.MemoryRequest ? row.Resource?.MemoryRequest : '-',
          {
            header: 'Memory',
            cell: ({ getValue }) => {
              const value = getValue();
              if (value === '-') {
                return value;
              }
              return humanize(value);
            },
          }
        ),
      ]),
    [hideStacksQuery.data]
  );
}
