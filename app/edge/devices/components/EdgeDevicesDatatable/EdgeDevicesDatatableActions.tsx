import { useRouter } from '@uirouter/react';

import type { Environment } from '@/portainer/environments/types';
import { Button } from '@/portainer/components/Button';
import { confirmAsync } from '@/portainer/services/modal.service/confirm';
import { promptAsync } from '@/portainer/services/modal.service/prompt';
import * as notifications from '@/portainer/services/notifications';
import { activateDevice } from '@/portainer/hostmanagement/open-amt/open-amt.service';

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
  const hasSelectedItem = selectedItems.length === 1;

  const router = useRouter();

  return (
    <div className="actionBar">
      {isFDOEnabled && (
        <Button onClick={() => onAddNewDeviceClick()}>
          <i className="fa fa-plus-circle space-right" aria-hidden="true" />
          Add new
        </Button>
      )}

      {isOpenAMTEnabled && (
        <Button
          disabled={!hasSelectedItem}
          onClick={() => onAssociateOpenAMTClick(selectedItems)}
        >
          <i className="fa fa-link space-right" aria-hidden="true" />
          Associate with OpenAMT
        </Button>
      )}
    </div>
  );

  async function onAddNewDeviceClick() {
    const result = await promptAsync({
      title: 'How would you like to add an Edge Device?',
      inputType: 'radio',
      inputOptions: [
        {
          text: 'Provision bare-metal using Intel FDO',
          value: '1',
        },
        {
          text: 'Deploy agent manually',
          value: '2',
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
      case '1':
        router.stateService.go('portainer.endpoints.importDevice');
        break;
      case '2':
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
