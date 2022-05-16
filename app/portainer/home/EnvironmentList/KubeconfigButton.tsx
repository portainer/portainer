import { useState } from 'react';
import { useQuery } from 'react-query';
import { DialogOverlay } from '@reach/dialog';

import * as kcService from '@/kubernetes/services/kubeconfig.service';
import * as notifications from '@/portainer/services/notifications';
import { Environment } from '@/portainer/environments/types';
import { EnvironmentsQueryParams } from '@/portainer/environments/environment.service/index';
import { isKubernetesEnvironment } from '@/portainer/environments/utils';
import { useEnvironmentList } from '@/portainer/environments/queries';
import { trackEvent } from '@/angulartics.matomo/analytics-services';
import { Button } from '@/portainer/components/Button';
import { Widget } from '@/portainer/components/widget';
import { PaginationControls } from '@/portainer/components/pagination-controls';
import { usePaginationLimitState } from '@/portainer/hooks/usePaginationLimitState';

import styles from './KubeconfigButton.module.css';
import '@reach/dialog/styles.css';

const selection = new Set<number>();
export interface KubeconfigButtonProps {
  environments: Environment[];
  envQueryParams: EnvironmentsQueryParams;
}
export function KubeconfigButton({
  environments,
  envQueryParams,
}: KubeconfigButtonProps) {
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
          <KubeconfigPormpt
            kubeServiceExpiry={kubeServiceExpiryQuery.data}
            selection={selection}
            envQueryParams={envQueryParams}
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

    selection.clear();
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
    if (selection.size === 0) {
      notifications.warning('No environment was selected', '');
      return;
    }
    try {
      await kcService.downloadKubeconfigFile(Array.from(selection));
      setShowDialog(false);
    } catch (e) {
      notifications.error('Failed downloading kubeconfig file', e as Error);
    }
  }
}

export interface KubeconfigPormptProps {
  kubeServiceExpiry: string | undefined;
  selection: Set<number>;
  envQueryParams: EnvironmentsQueryParams;
}
const storageKey = 'home_endpoints';

export function KubeconfigPormpt({
  kubeServiceExpiry,
  selection,
  envQueryParams,
}: KubeconfigPormptProps) {
  const [page, setPage] = useState(1);
  const [pageLimit, setPageLimit] = usePaginationLimitState(storageKey);
  const [checkChanged, setCheckChanged] = useState(false);
  const [checkAll, setCheckAll] = useState(false);
  const { environments, totalCount } = useEnvironmentList(
    { page, pageLimit, ...envQueryParams },
    true
  );
  const kubeEnvs = environments.filter((env) =>
    isKubernetesEnvironment(env.Type)
  );

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
      <div className={styles.checkbox}>
        <label>
          <input
            type="checkbox"
            checked={isCheckAll()}
            onChange={() => onCheckAll()}
          />
          &nbsp;Select all (in this page)
        </label>
      </div>
      <div className="datatable">
        <div className="bootbox-checkbox-list">
          {kubeEnvs.map((env) => (
            <div className={styles.checkbox} key={env.Id}>
              <label>
                <input
                  type="checkbox"
                  checked={selection.has(env.Id)}
                  onChange={() => onCheck(env.Id)}
                />
                &nbsp;{env.Name} ({env.URL})
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

  function onCheck(envId: number) {
    if (selection.has(envId)) {
      selection.delete(envId);
    } else {
      selection.add(envId);
    }
    setCheckChanged(!checkChanged);
  }

  function isCheckAll() {
    return kubeEnvs.every(({ Id }) => selection.has(Id));
  }

  function onCheckAll() {
    if (isCheckAll()) {
      for (let i = 0; i < kubeEnvs.length; i += 1) {
        selection.delete(kubeEnvs[i].Id);
      }
    } else {
      for (let i = 0; i < kubeEnvs.length; i += 1) {
        selection.add(kubeEnvs[i].Id);
      }
    }
    setCheckAll(!checkAll);
  }
}
