import { useState } from 'react';
import { DialogOverlay } from '@reach/dialog';

import * as kcService from '@/kubernetes/services/kubeconfig.service';
import * as notifications from '@/portainer/services/notifications';
import { EnvironmentType } from '@/portainer/environments/types';
import { EnvironmentsQueryParams } from '@/portainer/environments/environment.service/index';
import { usePaginationLimitState } from '@/portainer/hooks/usePaginationLimitState';
import { useEnvironmentList } from '@/portainer/environments/queries/useEnvironmentList';
import { usePublicSettings } from '@/portainer/settings/queries';

import { PaginationControls } from '@@/PaginationControls';
import { Checkbox } from '@@/form-components/Checkbox';
import { Button } from '@@/buttons';

import { useSelection } from './KubeconfigSelection';
import styles from './KubeconfigPrompt.module.css';
import '@reach/dialog/styles.css';

export interface KubeconfigPromptProps {
  envQueryParams: EnvironmentsQueryParams;
  onClose: () => void;
}
const storageKey = 'home_endpoints';

export function KubeconfigPrompt({
  envQueryParams,
  onClose,
}: KubeconfigPromptProps) {
  const [page, setPage] = useState(1);
  const [pageLimit, setPageLimit] = usePaginationLimitState(storageKey);

  const expiryQuery = usePublicSettings({
    select: (settings) => expiryMessage(settings.KubeconfigExpiry),
  });

  const { selection, toggle: toggleSelection, selectionSize } = useSelection();
  const { environments, totalCount } = useEnvironmentList({
    ...envQueryParams,
    page,
    pageLimit,
    types: [
      EnvironmentType.KubernetesLocal,
      EnvironmentType.AgentOnKubernetes,
      EnvironmentType.EdgeAgentOnKubernetes,
    ],
  });
  const isAllPageSelected = environments.every((env) => selection[env.Id]);

  return (
    <DialogOverlay
      className={styles.dialog}
      aria-label="Kubeconfig View"
      role="dialog"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <button type="button" className="close" onClick={onClose}>
              ×
            </button>
            <h5 className="modal-title">Download kubeconfig file</h5>
          </div>
          <div className="modal-body">
            <form className="bootbox-form">
              <div className="bootbox-prompt-message">
                <span>
                  Select the kubernetes environments to add to the kubeconfig
                  file. You may select across multiple pages.
                </span>
                <span className="space-left">{expiryQuery.data}</span>
              </div>
            </form>
            <br />
            <Checkbox
              id="settings-container-truncate-nae"
              label="Select all (in this page)"
              checked={isAllPageSelected}
              onChange={handleSelectAll}
            />
            <div className="datatable">
              <div className="bootbox-checkbox-list">
                {environments.map((env) => (
                  <div className={styles.checkbox}>
                    <Checkbox
                      id={`${env.Id}`}
                      label={`${env.Name} (${env.URL})`}
                      checked={!!selection[env.Id]}
                      onChange={() =>
                        toggleSelection(env.Id, !selection[env.Id])
                      }
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
            <Button onClick={onClose} color="default">
              Cancel
            </Button>
            <Button onClick={handleDownload}>Download File</Button>
          </div>
        </div>
      </div>
    </DialogOverlay>
  );

  function handleSelectAll() {
    environments.forEach((env) => toggleSelection(env.Id, !isAllPageSelected));
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
      onClose();
    } catch (e) {
      notifications.error('Failed downloading kubeconfig file', e as Error);
    }
  }
}

export function expiryMessage(expiry: string) {
  const prefix = 'Kubeconfig file will';
  switch (expiry) {
    case '24h':
      return `${prefix} expire in 1 day.`;
    case '168h':
      return `${prefix} expire in 7 days.`;
    case '720h':
      return `${prefix} expire in 30 days.`;
    case '8640h':
      return `${prefix} expire in 1 year.`;
    case '0':
    default:
      return `${prefix} not expire.`;
  }
}
