import { useState } from 'react';

import {
  TableSettingsProvider,
  useTableSettings,
} from '@/portainer/components/datatables/components/useTableSettings';
import { useEnvironmentList } from '@/portainer/environments/queries';
import { Environment } from '@/portainer/environments/types';

import { EdgeDeviceTableSettings } from '../../types';

import {
  EdgeDevicesDatatable,
  EdgeDevicesTableProps,
} from './EdgeDevicesDatatable';
import { Pagination } from './types';

export function EdgeDevicesDatatableContainer({
  ...props
}: Omit<
  EdgeDevicesTableProps,
  'dataset' | 'pagination' | 'onChangePagination' | 'totalCount'
>) {
  const defaultSettings = {
    autoRefreshRate: 0,
    hiddenQuickActions: [],
    hiddenColumns: [],
    pageSize: 10,
    sortBy: { id: 'state', desc: false },
  };

  const storageKey = 'edgeDevices';

  return (
    <TableSettingsProvider defaults={defaultSettings} storageKey={storageKey}>
      <Loader>
        {({ environments, pagination, totalCount, setPagination }) => (
          <EdgeDevicesDatatable
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            storageKey={storageKey}
            dataset={environments}
            pagination={pagination}
            onChangePagination={setPagination}
            totalCount={totalCount}
          />
        )}
      </Loader>
    </TableSettingsProvider>
  );
}

interface LoaderProps {
  children: (options: {
    environments: Environment[];
    totalCount: number;
    pagination: Pagination;
    setPagination(value: Partial<Pagination>): void;
  }) => React.ReactNode;
}

function Loader({ children }: LoaderProps) {
  const { settings } = useTableSettings<EdgeDeviceTableSettings>();
  const [pagination, setPagination] = useState({
    pageLimit: settings.pageSize,
    page: 1,
  });

  const { environments, isLoading, totalCount } = useEnvironmentList(
    {
      edgeDeviceFilter: 'trusted',
      ...pagination,
    },
    false,
    settings.autoRefreshRate * 1000
  );

  if (isLoading) {
    return null;
  }

  return (
    <>
      {children({
        environments,
        totalCount,
        pagination,
        setPagination: handleSetPagination,
      })}
    </>
  );

  function handleSetPagination(value: Partial<Pagination>) {
    setPagination((prev) => ({ ...prev, ...value }));
  }
}
