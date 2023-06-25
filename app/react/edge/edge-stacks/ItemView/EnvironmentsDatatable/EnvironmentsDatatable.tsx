import { useCurrentStateAndParams } from '@uirouter/react';
import { HardDrive } from 'lucide-react';
import { useMemo, useState } from 'react';

import { EdgeStackStatus, StatusType } from '@/react/edge/edge-stacks/types';
import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { useParamState } from '@/react/hooks/useParamState';

import { Datatable } from '@@/datatables';
import { useTableStateWithoutStorage } from '@@/datatables/useTableState';
import { PortainerSelect } from '@@/form-components/PortainerSelect';

import { useEdgeStack } from '../../queries/useEdgeStack';

import { EdgeStackEnvironment } from './types';
import { columns } from './columns';

export function EnvironmentsDatatable() {
  const {
    params: { stackId },
  } = useCurrentStateAndParams();
  const edgeStackQuery = useEdgeStack(stackId);

  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useParamState<StatusType>(
    'status',
    parseStatusFilter
  );
  const tableState = useTableStateWithoutStorage('name');
  const endpointsQuery = useEnvironmentList({
    pageLimit: tableState.pageSize,
    page,
    search: tableState.search,
    sort: tableState.sortBy.id as 'Group' | 'Name',
    order: tableState.sortBy.desc ? 'desc' : 'asc',
    edgeStackId: stackId,
    edgeStackStatus: statusFilter,
  });

  const environments: Array<EdgeStackEnvironment> = useMemo(
    () =>
      endpointsQuery.environments.map((env) => ({
        ...env,
        StackStatus:
          edgeStackQuery.data?.Status[env.Id] ||
          ({
            Details: {
              Pending: true,
              Acknowledged: false,
              ImagesPulled: false,
              Error: false,
              Ok: false,
              RemoteUpdateSuccess: false,
              Remove: false,
            },
            EndpointID: env.Id,
            Error: '',
          } satisfies EdgeStackStatus),
      })),
    [edgeStackQuery.data?.Status, endpointsQuery.environments]
  );

  return (
    <Datatable
      columns={columns}
      isLoading={endpointsQuery.isLoading}
      dataset={environments}
      settingsManager={tableState}
      title="Environments Status"
      titleIcon={HardDrive}
      onPageChange={setPage}
      emptyContentLabel="No environment available."
      disableSelect
      description={
        isBE && (
          <div className="w-1/4">
            <PortainerSelect<StatusType | undefined>
              isClearable
              bindToBody
              value={statusFilter}
              onChange={(e) => setStatusFilter(e || undefined)}
              options={[
                { value: 'Pending', label: 'Pending' },
                { value: 'Acknowledged', label: 'Acknowledged' },
                { value: 'ImagesPulled', label: 'Images pre-pulled' },
                { value: 'Ok', label: 'Deployed' },
                { value: 'Error', label: 'Failed' },
              ]}
            />
          </div>
        )
      }
    />
  );
}

function parseStatusFilter(status: string | undefined): StatusType | undefined {
  switch (status) {
    case 'Pending':
      return 'Pending';
    case 'Acknowledged':
      return 'Acknowledged';
    case 'ImagesPulled':
      return 'ImagesPulled';
    case 'Ok':
      return 'Ok';
    case 'Error':
      return 'Error';
    default:
      return undefined;
  }
}
