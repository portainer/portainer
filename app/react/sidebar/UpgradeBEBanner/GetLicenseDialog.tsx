import { HubspotForm } from '@@/HubspotForm';
import { Modal } from '@@/modals/Modal';

export function GetLicenseDialog({
  onDismiss,
  goToUploadLicense,
}: {
  onDismiss: () => void;
  goToUploadLicense: (isSubmitted: boolean) => void;
}) {
  return (
    <Modal
      onDismiss={onDismiss}
      aria-label="Upgrade Portainer to Business Edition"
      size="lg"
    >
      <Modal.Header
        title={<h4 className="font-medium text-xl">Upgrade Portainer</h4>}
      />
      <Modal.Body>
        <HubspotForm
          region="na1"
          portalId="4731999"
          formId="1ef8ea88-3e03-46c5-8aef-c1d9f48fd06b"
          onSubmitted={() => goToUploadLicense(true)}
          loading={<div>Loading...</div>}
        />
      </Modal.Body>
    </Modal>
  );
}
