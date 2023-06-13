import { useCurrentStateAndParams } from '@uirouter/react';
import { HardDrive } from 'lucide-react';
import { useMemo, useState } from 'react';

import { StatusType } from '@/react/edge/edge-stacks/types';
import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { useParamState } from '@/react/hooks/useParamState';

import { Datatable } from '@@/datatables';
import { useTableStateWithoutStorage } from '@@/datatables/useTableState';
import { PortainerSelect } from '@@/form-components/PortainerSelect';

import { useEdgeStack } from '../../queries/useEdgeStack';
import { uniqueStatus } from '../../utils/uniqueStatus';

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
        StackStatus: uniqueStatus(
          edgeStackQuery.data?.StatusArray[env.Id] || [
            {
              Type: StatusType.Pending,
              EndpointID: env.Id,
              Error: '',
              Time: new Date().valueOf() / 1000,
            },
          ]
        ),
      })),
    [edgeStackQuery.data?.StatusArray, endpointsQuery.environments]
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
                { value: StatusType.Pending, label: 'Pending' },
                { value: StatusType.Acknowledged, label: 'Acknowledged' },
                { value: StatusType.ImagesPulled, label: 'Images pre-pulled' },
                { value: StatusType.Ok, label: 'Deployed' },
                { value: StatusType.Error, label: 'Failed' },
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
      return StatusType.Pending;
    case 'Acknowledged':
      return StatusType.Acknowledged;
    case 'ImagesPulled':
      return StatusType.ImagesPulled;
    case 'Ok':
      return StatusType.Ok;
    case 'Error':
      return StatusType.Error;
    default:
      return undefined;
  }
}
