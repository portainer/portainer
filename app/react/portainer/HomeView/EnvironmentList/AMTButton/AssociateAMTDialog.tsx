import { useState } from 'react';
import clsx from 'clsx';

import { useActivateDevicesMutation } from '@/react/edge/edge-devices/open-amt/useActivateDevicesMutation';
import { usePaginationLimitState } from '@/react/hooks/usePaginationLimitState';
import { Query } from '@/react/portainer/environments/queries/useEnvironmentList';
import { EdgeTypes, Environment } from '@/react/portainer/environments/types';
import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { useListSelection } from '@/react/hooks/useListSelection';

import { Checkbox } from '@@/form-components/Checkbox';
import { Modal } from '@@/modals/Modal';
import { PaginationControls } from '@@/PaginationControls';
import { Button, LoadingButton } from '@@/buttons';

interface Props {
  envQueryParams: Query;
  onClose: () => void;
  selectedItems: Array<Environment['Id']>;
}

const storageKey = 'home_endpoints';

export function AssociateAMTDialog({
  selectedItems,
  onClose,
  envQueryParams,
}: Props) {
  const activateDeviceMutation = useActivateDevicesMutation();
  const [page, setPage] = useState(1);
  const [pageLimit, setPageLimit] = usePaginationLimitState(storageKey);

  const [selection, toggleSelection] =
    useListSelection<Environment['Id']>(selectedItems);

  const { environments, totalCount, isLoading } = useEnvironmentList({
    ...envQueryParams,
    page,
    pageLimit,
    types: EdgeTypes,
  });
  const isAllPageSelected =
    !isLoading && environments.every((env) => selection.includes(env.Id));

  return (
    <Modal onDismiss={onClose} aria-label="Associate with OpenAMT">
      <Modal.Header title="Associate with OpenAMT" />
      <Modal.Body>
        <span>
          Select the environments to add to associate to OpenAMT. You may select
          across multiple pages.
        </span>
        <div className="flex h-8 items-center">
          <Checkbox
            id="settings-container-truncate-name"
            data-cy="select-all-checkbox"
            label="Select all (in this page)"
            checked={isAllPageSelected}
            onChange={handleSelectAll}
          />
        </div>
        <div className="datatable">
          <div className="bootbox-checkbox-list">
            {environments.map((env) => (
              <div
                key={env.Id}
                className={clsx('flex h-8 items-center pl-2 pt-1')}
              >
                <Checkbox
                  id={`${env.Id}`}
                  data-cy={`environment-checkbox-${env.Name}`}
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
              pageCount={Math.ceil(totalCount / pageLimit)}
            />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          onClick={onClose}
          color="default"
          data-cy="associate-amt-dialog-cancel-button"
        >
          Cancel
        </Button>
        <LoadingButton
          onClick={handleSubmit}
          data-cy="associate-amt-dialog-associate-button"
          disabled={selection.length === 0}
          loadingText="Associating..."
          isLoading={activateDeviceMutation.isLoading}
        >
          Associate Devices
        </LoadingButton>
      </Modal.Footer>
    </Modal>
  );

  function handleSelectAll() {
    environments.forEach((env) => toggleSelection(env.Id, !isAllPageSelected));
  }

  function handleSubmit() {
    activateDeviceMutation.mutate(selection, {
      onSuccess() {
        onClose();
      },
    });
  }
}
