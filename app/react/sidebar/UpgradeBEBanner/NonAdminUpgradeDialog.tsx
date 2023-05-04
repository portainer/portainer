import { ExternalLink } from 'lucide-react';

import { Button } from '@@/buttons';
import { Modal } from '@@/modals/Modal';
import { ModalType } from '@@/modals/Modal/types';

export function NonAdminUpgradeDialog({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  return (
    <Modal aria-label="Upgrade Portainer to Business Edition">
      <Modal.Header
        title="Contact your administrator"
        modalType={ModalType.Warn}
      />
      <Modal.Body>
        You need to be logged in as an admin to upgrade Portainer to Business
        Edition.
      </Modal.Body>
      <Modal.Footer>
        <div className="flex w-full gap-2">
          <Button
            color="default"
            size="medium"
            className="w-1/3"
            onClick={() => onDismiss()}
          >
            Cancel
          </Button>

          <a
            href="https://www.portainer.io/take-5"
            target="_blank"
            rel="noreferrer"
            className="no-link w-2/3"
          >
            <Button
              color="primary"
              size="medium"
              className="w-full"
              icon={ExternalLink}
            >
              Learn about Business Edition
            </Button>
          </a>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
