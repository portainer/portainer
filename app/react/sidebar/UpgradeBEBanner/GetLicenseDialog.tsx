import { useAnalytics } from '@/react/hooks/useAnalytics';

import { HubspotForm } from '@@/HubspotForm';
import { Modal } from '@@/modals/Modal';

export function GetLicenseDialog({
  onDismiss,
  goToUploadLicense,
}: {
  onDismiss: () => void;
  goToUploadLicense: (isSubmitted: boolean) => void;
}) {
  // form is loaded from hubspot, so it won't have the same styling as the rest of the app
  // since it won't support darkmode, we enforce a white background and black text for the components we use
  // (Modal, CloseButton, loading text)
  const { trackEvent } = useAnalytics();

  return (
    <Modal
      onDismiss={onDismiss}
      aria-label="Upgrade Portainer to Business Edition"
      size="lg"
      className="!bg-white [&>.close-button]:!text-black"
    >
      <Modal.Body>
        <div className="max-h-[80vh] overflow-auto">
          <HubspotForm
            region="na1"
            portalId="4731999"
            formId="1ef8ea88-3e03-46c5-8aef-c1d9f48fd06b"
            onSubmitted={() => {
              trackEvent('portainer-upgrade-license-key-requested', {
                category: 'portainer',
                metadata: { 'Upgrade-key-requested': true },
              });

              goToUploadLicense(true);
            }}
            loading={<div className="text-black">Loading...</div>}
          />
        </div>
      </Modal.Body>
    </Modal>
  );
}
