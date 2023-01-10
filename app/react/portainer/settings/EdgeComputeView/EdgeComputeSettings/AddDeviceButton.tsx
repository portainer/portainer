import { useRouter } from '@uirouter/react';
import { Plus } from 'lucide-react';

import { promptAsync } from '@/portainer/services/modal.service/prompt';

import { Button } from '@@/buttons';

import { usePublicSettings } from '../../queries';

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

  function getDeployType(): Promise<DeployType> {
    if (!isFDOEnabled) {
      return Promise.resolve(DeployType.MANUAL);
    }

    return promptAsync({
      title: 'How would you like to add an Edge Device?',
      inputType: 'radio',
      inputOptions: [
        {
          text: 'Provision bare-metal using Intel FDO',
          value: DeployType.FDO,
        },
        {
          text: 'Deploy agent manually',
          value: DeployType.MANUAL,
        },
      ],
      buttons: {
        confirm: {
          label: 'Confirm',
          className: 'btn-primary',
        },
      },
    }) as Promise<DeployType>;
  }
}
