import { Modal } from '@@/modals/Modal';

export function LoadingDialog() {
  return (
    <Modal aria-label="Upgrade Portainer to Business Edition">
      <Modal.Header title={null} />

      <Modal.Body>Loading</Modal.Body>
    </Modal>
  );
}
