import { useState } from 'react';

import { EnvironmentId } from '@/portainer/environments/types';
import { EnvironmentsQueryParams } from '@/portainer/environments/environment.service/index';
import { isKubernetesEnvironment } from '@/portainer/environments/utils';
import { Widget } from '@/portainer/components/widget';
import { PaginationControls } from '@/portainer/components/pagination-controls';
import { usePaginationLimitState } from '@/portainer/hooks/usePaginationLimitState';
import { useEnvironmentList } from '@/portainer/environments/queries/useEnvironmentList';
import '@reach/dialog/styles.css';

export interface KubeconfigPromptProps {
  kubeServiceExpiry: string | undefined;
  selection: Record<EnvironmentId, boolean>;
  envQueryParams: EnvironmentsQueryParams;
  onToggleSelection: (id: EnvironmentId, selected: boolean) => void;
}
const storageKey = 'home_endpoints';

export function KubeconfigPrompt({
  kubeServiceExpiry,
  selection,
  envQueryParams,
  onToggleSelection,
}: KubeconfigPromptProps) {
  const [page, setPage] = useState(1);
  const [pageLimit, setPageLimit] = usePaginationLimitState(storageKey);

  const { environments, totalCount } = useEnvironmentList({
    page,
    pageLimit,
    ...envQueryParams,
  });
  const kubeEnvs = environments.filter((env) =>
    isKubernetesEnvironment(env.Type)
  );

  const isAllPageSelected = kubeEnvs.every((env) => selection[env.Id]);

  return (
    <div className="modal-body">
      <form className="bootbox-form">
        <div className="bootbox-prompt-message">
          <p>
            Select the kubernetes environment(s) to add to the kubeconfig file.
            <br />
            {kubeServiceExpiry}
          </p>
        </div>
      </form>
      <i className="space-right" aria-hidden="true" />
      <label>
        <input
          type="checkbox"
          checked={isAllPageSelected}
          onChange={handleSelectAll}
        />
        <i className="space-right" aria-hidden="true" />
        Select all (in this page)
      </label>
      <div className="datatable">
        <div className="bootbox-checkbox-list">
          {kubeEnvs.map((env) => (
            <div key={env.Id}>
              <i className="space-right" aria-hidden="true" />
              <label>
                <input
                  type="checkbox"
                  checked={!!selection[env.Id]}
                  onChange={() => onToggleSelection(env.Id, !selection[env.Id])}
                />
                <i className="space-right" aria-hidden="true" />
                {env.Name} ({env.URL})
              </label>
            </div>
          ))}
        </div>
        <Widget>
          <div className="footer">
            <PaginationControls
              showAll={totalCount <= 100}
              page={page}
              onPageChange={setPage}
              pageLimit={pageLimit}
              onPageLimitChange={setPageLimit}
              totalCount={totalCount}
            />
          </div>
        </Widget>
      </div>
    </div>
  );

  function handleSelectAll() {
    kubeEnvs.forEach((env) => onToggleSelection(env.Id, !isAllPageSelected));
  }
}
