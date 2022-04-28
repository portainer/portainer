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

export function EdgeDevicesDatatableContainer({
  ...props
}: Omit<EdgeDevicesTableProps, 'dataset'>) {
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
        {(environments) => (
          <EdgeDevicesDatatable
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            storageKey={storageKey}
            dataset={environments}
          />
        )}
      </Loader>
    </TableSettingsProvider>
  );
}

interface LoaderProps {
  children: (environments: Environment[]) => React.ReactNode;
}

function Loader({ children }: LoaderProps) {
  const { settings } = useTableSettings<EdgeDeviceTableSettings>();

  const { environments, isLoading } = useEnvironmentList(
    {
      edgeDeviceFilter: 'trusted',
      pageLimit: 100,
      page: 1,
    },
    false,
    settings.autoRefreshRate * 1000
  );

  if (isLoading) {
    return null;
  }

  return <>{children(environments)}</>;
}
