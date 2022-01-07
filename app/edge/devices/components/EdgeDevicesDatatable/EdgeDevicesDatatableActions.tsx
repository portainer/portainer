import type {Environment } from 'Portainer/environments/types';
import { Button } from 'Portainer/components/Button';
import { confirm } from "Portainer/services/modal.service/confirm";
import { prompt } from "Portainer/services/modal.service/prompt";
import * as notifications from 'Portainer/services/notifications';
import {activateDevice} from "Portainer/hostmanagement/open-amt/open-amt.service";
import {useRouter} from "@uirouter/react";

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

  function onAddNewDeviceClick() {
    prompt({
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
          label: 'Yes, confirm',
          className: 'btn-primary',
        },
      },
      callback: async (result: string) => {
        switch (result) {
          case "1":
            router.stateService.go('portainer.endpoints.importdevice');
            break;
          case "2":
            router.stateService.go('portainer.endpoints.new');
            break;
          default:
            break;
        }

      },
    });
  }

  function onAssociateOpenAMTClick(selectedItems: Environment[]) {
    const selectedEnvironment = selectedItems[0];

    confirm({
      title: '',
      message: `Associate ${selectedEnvironment.Name} with OpenAMT`,
      buttons: {
        cancel: {
          label: 'Cancel',
          className: 'btn-default',
        },
        confirm: {
          label: 'Yes, confirm',
          className: 'btn-primary',
        },
      },
      callback: async (result: boolean) => {
        if (!result) {
          return;
        }

        try {
          setLoadingMessage('Activating Active Management Technology on selected device...');
          await activateDevice(selectedEnvironment.Id)
          notifications.success('Successfully associated with OpenAMT', selectedEnvironment.Name);
        } catch (err) {
          notifications.error('Failure', err as Error, 'Unable to associate with OpenAMT');
        } finally {
          setLoadingMessage('');
        }

      },
    });

  }

}
