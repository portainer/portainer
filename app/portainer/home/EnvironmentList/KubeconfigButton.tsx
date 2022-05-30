import { useState } from 'react';
import { useQuery } from 'react-query';
import { DialogOverlay } from '@reach/dialog';

import * as kcService from '@/kubernetes/services/kubeconfig.service';
import * as notifications from '@/portainer/services/notifications';
import { Environment, EnvironmentId } from '@/portainer/environments/types';
import { EnvironmentsQueryParams } from '@/portainer/environments/environment.service/index';
import { isKubernetesEnvironment } from '@/portainer/environments/utils';
import { trackEvent } from '@/angulartics.matomo/analytics-services';
import { Button } from '@/portainer/components/Button';
import { Widget } from '@/portainer/components/widget';
import { PaginationControls } from '@/portainer/components/pagination-controls';
import { usePaginationLimitState } from '@/portainer/hooks/usePaginationLimitState';
import { useEnvironmentList } from '@/portainer/environments/queries';

import styles from './KubeconfigButton.module.css';
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
export interface KubeconfigButtonProps {
  environments: Environment[];
  envQueryParams: EnvironmentsQueryParams;
}
export function KubeconfigButton({
  environments,
  envQueryParams,
}: KubeconfigButtonProps) {
  const { selection, toggle: toggleSelection, selectionSize } = useSelection();
  const [showDialog, setShowDialog] = useState(false);
  const kubeServiceExpiryQuery = useQuery(['kubeServiceExpiry'], async () => {
    const expiryMessage = await kcService.expiryMessage();
    return expiryMessage;
  });
  if (!environments) {
    return null;
  }

  if (!isKubeconfigButtonVisible(environments)) {
    return null;
  }

  return (
    <div>
      <Button onClick={handleClick}>
        <i className="fas fa-download space-right" /> kubeconfig
      </Button>
      <DialogOverlay
        className={styles.dialog}
        isOpen={showDialog}
        aria-label="Kubeconfig View"
        role="dialog"
      >
        <div className="modal-content">
          <div className="modal-header">
            <button type="button" className="close" onClick={handleClose}>
              ×
            </button>
            <h5 className="modal-title">Download kubeconfig file</h5>
          </div>
          <KubeconfigPrompt
            kubeServiceExpiry={kubeServiceExpiryQuery.data}
            selection={selection}
            envQueryParams={envQueryParams}
            onToggleSelection={toggleSelection}
          />
          <div className="modal-footer">
            <Button onClick={handleClose} color="default">
              Cancel
            </Button>
            <Button onClick={handleDownload}>Download File</Button>
          </div>
        </div>
      </DialogOverlay>
    </div>
  );

  function handleClick() {
    if (!environments) {
      return;
    }

    trackEvent('kubernetes-kubectl-kubeconfig-multi', {
      category: 'kubernetes',
    });

    setShowDialog(true);
  }

  function handleClose() {
    setShowDialog(false);
  }

  function handleDownload() {
    confirmKubeconfigSelection();
  }

  function isKubeconfigButtonVisible(environments: Environment[]) {
    if (window.location.protocol !== 'https:') {
      return false;
    }
    return environments.some((env) => isKubernetesEnvironment(env.Type));
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
      setShowDialog(false);
    } catch (e) {
      notifications.error('Failed downloading kubeconfig file', e as Error);
    }
  }
}

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
