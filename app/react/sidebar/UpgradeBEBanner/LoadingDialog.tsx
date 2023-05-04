import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useSystemStatus } from '@/react/portainer/system/useSystemStatus';

import { Modal } from '@@/modals/Modal';
import { Icon } from '@@/Icon';

export function LoadingDialog() {
  useWaitForServerStatus();

  return (
    <Modal aria-label="Upgrade Portainer to Business Edition">
      <Modal.Body>
        <div className="flex w-full flex-col items-center justify-center">
          <Icon
            icon={Loader2}
            className="animate-spin-slow !text-8xl !text-blue-8"
            aria-label="loading"
          />

          <h1 className="!text-2xl">Upgrading Portainer...</h1>

          <p className="text-center text-xl text-gray-6">
            Please wait while we upgrade your Portainer to Business Edition.
          </p>
        </div>
      </Modal.Body>
    </Modal>
  );
}

function useWaitForServerStatus() {
  const [enabled, setEnabled] = useState(false);
  useSystemStatus({
    enabled,
    retry: true,
    onSuccess() {
      window.location.reload();
    },
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setEnabled(true);
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
    };
  });
}
