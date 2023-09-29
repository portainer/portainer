import { useCurrentUser } from '@/react/hooks/useUser';
import helm from '@/assets/ico/helm.svg?c';

import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

import { columns } from './columns';
import { HelmRepositoryDatatableActions } from './HelmRepositoryDatatableActions';
import { useHelmRepositories } from './helm-repositories.service';
import { HelmRepository } from './types';

const storageKey = 'helmRepository';

const settingsStore = createPersistedStore(storageKey);

export function HelmRepositoryDatatable() {
  const { user } = useCurrentUser();
  const helmReposQuery = useHelmRepositories(user.Id);

  const tableState = useTableState(settingsStore, storageKey);

  let helmRepos = [];
  if (helmReposQuery.data?.GlobalRepository) {
    helmRepos.push({
      Global: true,
      URL: helmReposQuery.data.GlobalRepository,
    } as HelmRepository);
  }
  helmRepos = [...helmRepos, ...(helmReposQuery.data?.UserRepositories ?? [])];

  return (
    <Datatable
      dataset={helmRepos}
      settingsManager={tableState}
      columns={columns}
      title="Helm Repositories"
      titleIcon={helm}
      renderTableActions={(selectedRows) => (
        <HelmRepositoryDatatableActions selectedItems={selectedRows} />
      )}
      emptyContentLabel="No helm repository found"
      isLoading={helmReposQuery.isLoading}
      isRowSelectable={(row) => !row.original.Global}
    />
  );
}
