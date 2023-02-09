import { X } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';
import { DialogContent, DialogOverlay } from '@reach/dialog';

import { downloadKubeconfigFile } from '@/react/kubernetes/services/kubeconfig.service';
import * as notifications from '@/portainer/services/notifications';
import {
  Environment,
  EnvironmentType,
} from '@/react/portainer/environments/types';
import { usePaginationLimitState } from '@/react/hooks/usePaginationLimitState';
import { usePublicSettings } from '@/react/portainer/settings/queries';
import {
  Query,
  useEnvironmentList,
} from '@/react/portainer/environments/queries/useEnvironmentList';
import { useListSelection } from '@/react/hooks/useListSelection';

import { PaginationControls } from '@@/PaginationControls';
import { Checkbox } from '@@/form-components/Checkbox';
import { Button } from '@@/buttons';

import styles from './KubeconfigPrompt.module.css';
import '@reach/dialog/styles.css';

export interface KubeconfigPromptProps {
  envQueryParams: Query;
  onClose: () => void;
  selectedItems: Array<Environment['Id']>;
}
const storageKey = 'home_endpoints';

export function KubeconfigPrompt({
  envQueryParams,
  onClose,
  selectedItems,
}: KubeconfigPromptProps) {
  const [page, setPage] = useState(1);
  const [pageLimit, setPageLimit] = usePaginationLimitState(storageKey);

  const expiryQuery = usePublicSettings({
    select: (settings) => expiryMessage(settings.KubeconfigExpiry),
  });

  const [selection, toggleSelection] =
    useListSelection<Environment['Id']>(selectedItems);

  const { environments, totalCount, isLoading } = useEnvironmentList({
    ...envQueryParams,
    page,
    pageLimit,
    types: [
      EnvironmentType.KubernetesLocal,
      EnvironmentType.AgentOnKubernetes,
      EnvironmentType.EdgeAgentOnKubernetes,
    ],
  });
  const isAllPageSelected =
    !isLoading &&
    environments
      .filter((env) => env.Status <= 2)
      .every((env) => selection.includes(env.Id));

  return (
    <DialogOverlay
      className={styles.dialog}
      aria-label="Kubeconfig View"
      role="dialog"
      onDismiss={onClose}
    >
      <DialogContent className="modal-dialog bg-transparent p-0">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" onClick={onClose}>
                <X />
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
              <div className="flex h-8 items-center">
                <Checkbox
                  id="settings-container-truncate-name"
                  label="Select all (in this page)"
                  checked={isAllPageSelected}
                  onChange={handleSelectAll}
                />
              </div>
              <div className="datatable">
                <div className="bootbox-checkbox-list">
                  {environments
                    .filter((env) => env.Status <= 2)
                    .map((env) => (
                      <div
                        key={env.Id}
                        className={clsx(
                          styles.checkbox,
                          'flex h-8 items-center pt-1'
                        )}
                      >
                        <Checkbox
                          id={`${env.Id}`}
                          label={`${env.Name} (${env.URL})`}
                          checked={selection.includes(env.Id)}
                          onChange={() =>
                            toggleSelection(env.Id, !selection.includes(env.Id))
                          }
                        />
                      </div>
                    ))}
                </div>
                <div className="flex w-full justify-end pt-3">
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
              <Button
                onClick={handleDownload}
                disabled={selection.length === 0}
              >
                Download File
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </DialogOverlay>
  );

  function handleSelectAll() {
    environments.forEach((env) => toggleSelection(env.Id, !isAllPageSelected));
  }

  function handleDownload() {
    confirmKubeconfigSelection();
  }

  async function confirmKubeconfigSelection() {
    if (selection.length === 0) {
      notifications.warning('No environment was selected', '');
      return;
    }
    try {
      await downloadKubeconfigFile(selection);
      onClose();
    } catch (e) {
      notifications.error('Failed downloading kubeconfig file', e as Error);
    }
  }
}

export function expiryMessage(expiry: string) {
  const prefix = 'The kubeconfig file will';
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
