import { useState } from 'react';

import { Modal, OnSubmit, ModalType, openModal } from '@@/modals';
import { Button } from '@@/buttons';
import { SwitchField } from '@@/form-components/SwitchField';
import { TextTip } from '@@/Tip/TextTip';

interface Props {
  onSubmit: OnSubmit<{ pullLatest: boolean }>;

  cannotPullImage: boolean;
}

function ConfirmRecreationModal({ onSubmit, cannotPullImage }: Props) {
  const [pullLatest, setPullLatest] = useState(false);

  return (
    <Modal
      onDismiss={() => onSubmit()}
      aria-label="confirm recreate container modal"
    >
      <Modal.Header title="Are you sure?" modalType={ModalType.Destructive} />

      <Modal.Body>
        <p>
          You&apos;re about to recreate this container and any non-persisted
          data will be lost. This container will be removed and another one will
          be created using the same configuration.
        </p>
        <SwitchField
          name="pullLatest"
          label="Re-pull image"
          checked={pullLatest}
          onChange={setPullLatest}
          disabled={cannotPullImage}
        />
        {cannotPullImage && (
          <div className="mt-1 text-sm">
            <TextTip color="orange">
              Cannot re-pull as the image is inaccessible - either it no longer
              exists or the tag or name is no longer correct.
            </TextTip>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => onSubmit()} color="default">
          Cancel
        </Button>
        <Button onClick={() => onSubmit({ pullLatest })} color="danger">
          Recreate
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export async function confirmContainerRecreation(cannotPullImage: boolean) {
  return openModal(ConfirmRecreationModal, {
    cannotPullImage,
  });
}
