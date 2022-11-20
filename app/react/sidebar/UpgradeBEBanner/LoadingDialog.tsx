import CircleNotch from '@/assets/ico/circle-notch.svg?c';

import { Modal } from '@@/modals/Modal';
import { Icon } from '@@/Icon';

export function LoadingDialog() {
  return (
    <Modal aria-label="Upgrade Portainer to Business Edition">
      <Modal.Header title={null} />

      <Modal.Body>
        <div className="flex flex-col items-center justify-center w-full">
          <Icon
            icon={CircleNotch}
            className="animate-spin-slow !text-8xl !text-blue-8"
            aria-label="loading"
          />

          <h1 className="!text-2xl">Upgrading Portainer...</h1>

          <p className="text-center text-gray-6 text-xl">
            Please wait while we upgrade your Portainer to Business Edition.
          </p>
        </div>
      </Modal.Body>
    </Modal>
  );
}
