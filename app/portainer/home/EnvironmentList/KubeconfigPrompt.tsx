import { useState } from 'react';
import { useQuery } from 'react-query';

import * as kcService from '@/kubernetes/services/kubeconfig.service';
import * as notifications from '@/portainer/services/notifications';
import { Button } from '@/portainer/components/Button';
import { Checkbox } from '@/portainer/components/form-components/Checkbox';
import { EnvironmentId } from '@/portainer/environments/types';
import { EnvironmentsQueryParams } from '@/portainer/environments/environment.service/index';
import { isKubernetesEnvironment } from '@/portainer/environments/utils';
import { PaginationControls } from '@/portainer/components/pagination-controls';
import { usePaginationLimitState } from '@/portainer/hooks/usePaginationLimitState';
import { useEnvironmentList } from '@/portainer/environments/queries/useEnvironmentList';

import styles from './KubeconfigPrompt.module.css';
import '@reach/dialog/styles.css';

function useSelection() {
  const [selection, setSelection] = useState<Record<EnvironmentId, boolean>>(
    {}
  );

  const selectionSize = Object.keys(selection).length;

  return { selection, toggle, selectionSize };

  function toggle(id: EnvironmentId, selected: boolean) {
    setSelection((prevSelection) => {
      const newSelection = { ...prevSelection };

      if (!selected) {
        delete newSelection[id];
      } else {
        newSelection[id] = true;
      }

      return newSelection;
    });
  }
}

export interface KubeconfigPromptProps {
  envQueryParams: EnvironmentsQueryParams;
  onToggleClose: () => void;
}
const storageKey = 'home_endpoints';

export function KubeconfigPrompt({
  envQueryParams,
  onToggleClose,
}: KubeconfigPromptProps) {
  const [page, setPage] = useState(1);
  const [pageLimit, setPageLimit] = usePaginationLimitState(storageKey);
  const kubeServiceExpiryQuery = useQuery(['kubeServiceExpiry'], async () => {
    const expiryMessage = await kcService.expiryMessage();
    return expiryMessage;
  });
  const { selection, toggle: toggleSelection, selectionSize } = useSelection();
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
    <div className="modal-content">
      <div className="modal-header">
        <button type="button" className="close" onClick={onToggleClose}>
          ×
        </button>
        <h5 className="modal-title">Download kubeconfig file</h5>
      </div>
      <div className="modal-body">
        <form className="bootbox-form">
          <div className="bootbox-prompt-message">
            <p>
              Select the kubernetes environment(s) to add to the kubeconfig
              file.
              <br />
              {kubeServiceExpiryQuery.data}
            </p>
          </div>
        </form>
        <Checkbox
          id="settings-container-truncate-nae"
          label="Select all (in this page)"
          checked={isAllPageSelected}
          onChange={handleSelectAll}
        />
        <div className="datatable">
          <div className="bootbox-checkbox-list">
            {kubeEnvs.map((env) => (
              <div className={styles.checkbox}>
                <Checkbox
                  id={`${env.Id}`}
                  label={`${env.Name} (${env.URL})`}
                  checked={!!selection[env.Id]}
                  onChange={() => toggleSelection(env.Id, !selection[env.Id])}
                />
              </div>
            ))}
          </div>
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
        </div>
      </div>
      <div className="modal-footer">
        <Button onClick={onToggleClose} color="default">
          Cancel
        </Button>
        <Button onClick={handleDownload}>Download File</Button>
      </div>
    </div>
  );

  function handleSelectAll() {
    kubeEnvs.forEach((env) => toggleSelection(env.Id, !isAllPageSelected));
  }

  function handleDownload() {
    confirmKubeconfigSelection();
  }

  async function confirmKubeconfigSelection() {
    if (selectionSize === 0) {
      notifications.warning('No environment was selected', '');
      return;
    }
    try {
      await kcService.downloadKubeconfigFile(
        Object.keys(selection).map(Number)
      );
      onToggleClose();
    } catch (e) {
      notifications.error('Failed downloading kubeconfig file', e as Error);
    }
  }
}
