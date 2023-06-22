import { HardDrive, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { useGroups } from '@/react/portainer/environments/environment-groups/queries';

import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';
import { useTableState } from '@@/datatables/useTableState';

import { isBE } from '../../feature-flags/feature-flags.service';
import { isSortType, refetchIfAnyOffline } from '../queries/useEnvironmentList';

import { columns } from './columns';
import { EnvironmentListItem } from './types';
import { ImportFdoDeviceButton } from './ImportFdoDeviceButton';

const tableKey = 'environments';
const settingsStore = createPersistedStore(tableKey, 'Name');

export function EnvironmentsDatatable({
  onRemove,
}: {
  onRemove: (environments: Array<EnvironmentListItem>) => void;
}) {
  const tableState = useTableState(settingsStore, tableKey);

  const [page, setPage] = useState(0);

  const groupsQuery = useGroups();
  const { environments, isLoading, totalCount } = useEnvironmentList(
    {
      search: tableState.search,
      excludeSnapshots: true,
      page: page + 1,
      pageLimit: tableState.pageSize,
      sort: isSortType(tableState.sortBy.id) ? tableState.sortBy.id : undefined,
      order: tableState.sortBy.desc ? 'desc' : 'asc',
    },
    { enabled: groupsQuery.isSuccess, refetchInterval: refetchIfAnyOffline }
  );

  const environmentsWithGroups = environments.map<EnvironmentListItem>(
    (env) => {
      const groupId = env.GroupId;
      const group = groupsQuery.data?.find((g) => g.Id === groupId);
      return {
        ...env,
        GroupName: group?.Name,
      };
    }
  );

  return (
    <Datatable
      title="Environments"
      titleIcon={HardDrive}
      dataset={environmentsWithGroups}
      columns={columns}
      settingsManager={tableState}
      pageCount={Math.ceil(totalCount / tableState.pageSize)}
      onPageChange={setPage}
      isLoading={isLoading}
      totalCount={totalCount}
      renderTableActions={(selectedRows) => (
        <div className="flex items-center gap-2">
          <Button
            color="dangerlight"
            disabled={selectedRows.length === 0}
            onClick={() => onRemove(selectedRows)}
            icon={Trash2}
            className="!m-0"
          >
            Remove
          </Button>

          <ImportFdoDeviceButton />

          {isBE && (
            <Button
              as={Link}
              color="secondary"
              icon={Plus}
              props={{ to: 'portainer.endpoints.edgeAutoCreateScript' }}
            >
              Auto onboarding
            </Button>
          )}

          <Button
            as={Link}
            props={{ to: 'portainer.wizard.endpoints' }}
            icon={Plus}
            className="!m-0"
          >
            Add environment
          </Button>
        </div>
      )}
    />
  );
}
