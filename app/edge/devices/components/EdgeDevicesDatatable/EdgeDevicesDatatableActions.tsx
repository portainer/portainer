import { useRouter } from '@uirouter/react';

import type { Environment } from '@/portainer/environments/types';
import { Button } from '@/portainer/components/Button';
import { confirmAsync } from '@/portainer/services/modal.service/confirm';
import { promptAsync } from '@/portainer/services/modal.service/prompt';
import * as notifications from '@/portainer/services/notifications';
import { activateDevice } from '@/portainer/hostmanagement/open-amt/open-amt.service';
import { deleteEndpoint } from "@/portainer/environments/environment.service";

interface Props {
  selectedItems: Environment[];
  isFDOEnabled: boolean;
  isOpenAMTEnabled: boolean;
  setLoadingMessage(message: string): void;
}

export function EdgeDevicesDatatableActions({
  selectedItems,
  isOpenAMTEnabled,
  isFDOEnabled,
  setLoadingMessage,
}: Props) {
  const router = useRouter();

  return (
    <div className="actionBar">
      <Button
          disabled={selectedItems.length < 1}
          color="danger"
          onClick={() => onDeleteEdgeDeviceClick()}
      >
        <i className="fa fa-trash-alt space-right" aria-hidden="true" />
        Remove
      </Button>

      {(isFDOEnabled || isOpenAMTEnabled) && (
        <Button onClick={() => onAddNewDeviceClick()}>
          <i className="fa fa-plus-circle space-right" aria-hidden="true" />
          Add new
        </Button>
      )}

      {isOpenAMTEnabled && (
        <Button
          disabled={selectedItems.length !== 1}
          onClick={() => onAssociateOpenAMTClick(selectedItems)}
        >
          <i className="fa fa-link space-right" aria-hidden="true" />
          Associate with OpenAMT
        </Button>
      )}
    </div>
  );

  async function onDeleteEdgeDeviceClick() {
    const confirmed = await confirmAsync({
      title: 'Are you sure ?',
      message: 'This action will remove all configurations associated to your environment(s). Continue?',
      buttons: {
        confirm: {
          label: 'Remove',
          className: 'btn-danger',
        },
      },
    });

    if (!confirmed) {
      return;
    }

    for (let i = 0; i < selectedItems.length; i += 1) {
      try {
        const environment = selectedItems[i];
        await deleteEndpoint(environment.Id)

        notifications.success(
            'Environment successfully removed',
            environment.Name
        );
      } catch (err) {
        notifications.error('Failure', err as Error, 'Unable to remove environment');
      }
    }
    await router.stateService.reload();
  }

  async function onAddNewDeviceClick() {
    if (!isFDOEnabled) {
      router.stateService.go('portainer.endpoints.newEdgeDevice');
      return;
    }

    if (!isOpenAMTEnabled) {
      router.stateService.go('portainer.endpoints.importDevice');
      return;
    }

    const result = await promptAsync({
      title: 'How would you like to add an Edge Device?',
      inputType: 'radio',
      inputOptions: [
        {
          text: 'Provision bare-metal using Intel FDO',
          value: 'FDO',
        },
        {
          text: 'Deploy agent manually',
          value: 'AMT',
        },
      ],
      buttons: {
        confirm: {
          label: 'Confirm',
          className: 'btn-primary',
        },
      },
    });

    switch (result) {
      case 'FDO':
        router.stateService.go('portainer.endpoints.importDevice');
        break;
      case 'AMT':
        router.stateService.go('portainer.endpoints.newEdgeDevice');
        break;
      default:
        break;
    }
  }

  async function onAssociateOpenAMTClick(selectedItems: Environment[]) {
    const selectedEnvironment = selectedItems[0];

    const confirmed = await confirmAsync({
      title: '',
      message: `Associate ${selectedEnvironment.Name} with OpenAMT`,
      buttons: {
        cancel: {
          label: 'Cancel',
          className: 'btn-default',
        },
        confirm: {
          label: 'Confirm',
          className: 'btn-primary',
        },
      },
    });

    if (!confirmed) {
      return;
    }

    try {
      setLoadingMessage(
        'Activating Active Management Technology on selected device...'
      );
      await activateDevice(selectedEnvironment.Id);
      notifications.success(
        'Successfully associated with OpenAMT',
        selectedEnvironment.Name
      );
    } catch (err) {
      notifications.error(
        'Failure',
        err as Error,
        'Unable to associate with OpenAMT'
      );
    } finally {
      setLoadingMessage('');
    }
  }
}
