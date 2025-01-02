import { HardDrive, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { useGroups } from '@/react/portainer/environments/environment-groups/queries';

import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { AddButton, Button } from '@@/buttons';
import { useTableState } from '@@/datatables/useTableState';

import { isBE } from '../../feature-flags/feature-flags.service';
import { isSortType } from '../queries/useEnvironmentList';
import { EnvironmentStatus } from '../types';

import { columns } from './columns';
import { EnvironmentListItem } from './types';

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
      sort: isSortType(tableState.sortBy?.id)
        ? tableState.sortBy?.id
        : undefined,
      order: tableState.sortBy?.desc ? 'desc' : 'asc',
    },
    { enabled: groupsQuery.isSuccess, refetchInterval: 30 * 1000 }
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
      isServerSidePagination
      page={page}
      onPageChange={setPage}
      totalCount={totalCount}
      isLoading={isLoading}
      isRowSelectable={(row) =>
        row.original.Status !== EnvironmentStatus.Provisioning
      }
      renderTableActions={(selectedRows) => (
        <div className="flex items-center gap-2">
          <Button
            color="dangerlight"
            disabled={selectedRows.length === 0}
            onClick={() => onRemove(selectedRows)}
            icon={Trash2}
            className="!m-0"
            data-cy="remove-environments-button"
          >
            Remove
          </Button>

          {isBE && (
            <AddButton
              color="secondary"
              data-cy="environments-auto-onboarding-button"
              to="portainer.endpoints.edgeAutoCreateScript"
            >
              Auto onboarding
            </AddButton>
          )}

          <AddButton
            to="portainer.wizard.endpoints"
            params={{ referrer: 'environments' }}
            data-cy="environments-add-environments-button"
          >
            Add environment
          </AddButton>
        </div>
      )}
      data-cy="environments-datatable"
    />
  );
}
