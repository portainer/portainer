import { useState } from 'react';

import { Modal, OnSubmit, ModalType, openModal } from '@@/modals';
import { Button } from '@@/buttons';
import { SwitchField } from '@@/form-components/SwitchField';

import { ImagesListResponse } from '../../queries/useImages';

interface Props {
  onSubmit: OnSubmit<{ pruneAll: boolean; clearBuildCache: boolean }>;
  images?: ImagesListResponse[];
}

function ConfirmPruneModal({ onSubmit, images = [] }: Props) {
  const [pruneAll, setPruneAll] = useState(false);
  const [clearBuildCache, setClearBuildCache] = useState(false);

  const hasUntaggedImages = images.some(
    (img) => !img.tags || img.tags.length === 0
  );
  const hasUnusedImages = images.some((img) => !img.used);
  const showValidationMessage =
    !pruneAll && !hasUntaggedImages && hasUnusedImages;

  return (
    <Modal onDismiss={() => onSubmit()} aria-label="confirm prune images modal">
      <Modal.Header title="Are you sure?" modalType={ModalType.Destructive} />
      <Modal.Body>
        <p>
          This will delete all untagged (dangling) images in this environment.
        </p>
        <div className="mb-4">
          <SwitchField
            name="pruneAll"
            data-cy="prune-all-unused-switch"
            label="Delete all unused images"
            tooltip="Delete all unused images, even if they are tagged."
            checked={pruneAll}
            onChange={setPruneAll}
          />
          {showValidationMessage && (
            <p className="text-muted mt-1 text-xs">
              No untagged (dangling) images available to delete.
            </p>
          )}
        </div>
        <SwitchField
          name="clearBuildCache"
          data-cy="prune-clear-build-cache-switch"
          label="Clear Docker build cache"
          tooltip="This removes cached build layers that are no longer in use. Future builds may take longer until the cache is rebuilt."
          checked={clearBuildCache}
          onChange={setClearBuildCache}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button
          onClick={() => onSubmit()}
          color="default"
          data-cy="prune-cancel"
        >
          Cancel
        </Button>
        <Button
          onClick={() => onSubmit({ pruneAll, clearBuildCache })}
          color="danger"
          data-cy="prune-confirm"
        >
          Continue
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export async function confirmPruneImages(images?: ImagesListResponse[]) {
  return openModal(ConfirmPruneModal, { images });
}
