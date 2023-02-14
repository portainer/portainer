import { useRouter } from '@uirouter/react';
import { Plus } from 'lucide-react';

import { usePublicSettings } from '@/react/portainer/settings/queries';

import { Button } from '@@/buttons';
import { openModal } from '@@/modals';

import { DeployTypePrompt } from './DeployTypePrompt';

enum DeployType {
  FDO = 'FDO',
  MANUAL = 'MANUAL',
}

export function AddDeviceButton() {
  const router = useRouter();
  const isFDOEnabledQuery = usePublicSettings({
    select: (settings) => settings.IsFDOEnabled,
  });
  const isFDOEnabled = !!isFDOEnabledQuery.data;

  return (
    <Button onClick={handleNewDeviceClick} icon={Plus}>
      Add Device
    </Button>
  );

  async function handleNewDeviceClick() {
    const result = await getDeployType();

    switch (result) {
      case DeployType.FDO:
        router.stateService.go('portainer.endpoints.importDevice');
        break;
      case DeployType.MANUAL:
        router.stateService.go('portainer.wizard.endpoints', {
          edgeDevice: true,
        });
        break;
      default:
        break;
    }
  }

  function getDeployType() {
    if (!isFDOEnabled) {
      return Promise.resolve(DeployType.MANUAL);
    }

    return askForDeployType();
  }
}

function askForDeployType() {
  return openModal(DeployTypePrompt, {});
}
