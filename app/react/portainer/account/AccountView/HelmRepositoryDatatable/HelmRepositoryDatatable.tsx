import { useMemo, useEffect } from 'react';

import { useCurrentUser } from '@/react/hooks/useUser';
import helm from '@/assets/ico/vendor/helm.svg?c';
import { isPureAdmin } from '@/portainer/users/user.helpers';

import { Link } from '@@/Link';
import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { TextTip } from '@@/Tip/TextTip';

import { columns } from './columns';
import { HelmRepositoryDatatableActions } from './HelmRepositoryDatatableActions';
import { useHelmRepositories } from './helm-repositories.service';
import { HelmRepository } from './types';

const storageKey = 'helmRepository';

const settingsStore = createPersistedStore(storageKey);

export function HelmRepositoryDatatable() {
  const { user } = useCurrentUser();
  const helmReposQuery = useHelmRepositories(user.Id);

  const isAdminUser = isPureAdmin(user);

  const tableState = useTableState(settingsStore, storageKey);

  const helmRepos = useMemo(() => {
    const helmRepos = [];
    if (helmReposQuery.data?.GlobalRepository) {
      const helmrepository: HelmRepository = {
        Global: true,
        URL: helmReposQuery.data.GlobalRepository,
        Id: 0,
        UserId: 0,
      };
      helmRepos.push(helmrepository);
    }
    return [...helmRepos, ...(helmReposQuery.data?.UserRepositories ?? [])];
  }, [
    helmReposQuery.data?.GlobalRepository,
    helmReposQuery.data?.UserRepositories,
  ]);

  useEffect(() => {
    // window.location.hash will get everything after the hashbang
    // the regex will match the the content after each hash
    const timeout = setTimeout(() => {
      const regEx = /#!.*#(.*)/;
      const match = window.location.hash.match(regEx);
      if (match && match[1]) {
        document.getElementById(match[1])?.scrollIntoView();
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Datatable
      getRowId={(row) => String(row.Id)}
      dataset={helmRepos}
      description={<HelmDatatableDescription isAdmin={isAdminUser} />}
      settingsManager={tableState}
      columns={columns}
      title="Helm repositories"
      titleIcon={helm}
      titleId="helm-repositories"
      renderTableActions={(selectedRows) => (
        <HelmRepositoryDatatableActions selectedItems={selectedRows} />
      )}
      isLoading={helmReposQuery.isLoading}
      isRowSelectable={(row) => !row.original.Global}
      data-cy="helm-repositories-datatable"
    />
  );
}

function HelmDatatableDescription({ isAdmin }: { isAdmin: boolean }) {
  return (
    <TextTip color="blue" className="mb-3">
      Adding a Helm repo here only makes it available in your own user
      account&apos;s Portainer UI. Helm charts are pulled down from these repos
      (plus the{' '}
      {isAdmin ? (
        <Link
          to="portainer.settings"
          params={{ '#': 'kubernetes-settings' }}
          data-cy="k8s-globally-select-repo-link"
        >
          <span>globally-set Helm repo</span>
        </Link>
      ) : (
        <span>globally-set Helm repo</span>
      )}
      ) and shown in the Create from Manifest screen&apos;s Helm charts list.
    </TextTip>
  );
}
