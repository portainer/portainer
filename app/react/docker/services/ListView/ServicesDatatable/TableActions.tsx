import { RefreshCw } from 'lucide-react';
import { useRouter } from '@uirouter/react';

import { ServiceViewModel } from '@/docker/models/service';
import { Authorized } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { notifySuccess } from '@/portainer/services/notifications';

import { AddButton, Button, ButtonGroup } from '@@/buttons';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { confirmServiceForceUpdate } from '../../common/update-service-modal';

import { useRemoveServicesMutation } from './useRemoveServicesMutation';
import { useForceUpdateServicesMutation } from './useForceUpdateServicesMutation';

export function TableActions({
  selectedItems,
  isAddActionVisible,
  isUpdateActionVisible,
}: {
  selectedItems: Array<ServiceViewModel>;
  isAddActionVisible?: boolean;
  isUpdateActionVisible?: boolean;
}) {
  const environmentId = useEnvironmentId();
  const removeMutation = useRemoveServicesMutation(environmentId);
  const updateMutation = useForceUpdateServicesMutation(environmentId);
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <ButtonGroup>
        {isUpdateActionVisible && (
          <Authorized authorizations="DockerServiceUpdate">
            <Button
              color="light"
              disabled={selectedItems.length === 0}
              onClick={() => handleUpdate(selectedItems)}
              icon={RefreshCw}
              data-cy="service-updateServiceButton"
            >
              Update
            </Button>
          </Authorized>
        )}
        <Authorized authorizations="DockerServiceDelete">
          <DeleteButton
            disabled={selectedItems.length === 0}
            onConfirmed={() => handleRemove(selectedItems)}
            confirmMessage="Do you want to remove the selected service(s)? All the containers associated to the selected service(s) will be removed too."
            data-cy="service-removeServiceButton"
          />
        </Authorized>
      </ButtonGroup>

      {isAddActionVisible && (
        <Authorized authorizations="DockerServiceCreate">
          <AddButton data-cy="docker-add-service-button">Add service</AddButton>
        </Authorized>
      )}
    </div>
  );

  async function handleUpdate(selectedItems: Array<ServiceViewModel>) {
    const confirmed = await confirmServiceForceUpdate(
      'Do you want to force an update of the selected service(s)? All the tasks associated to the selected service(s) will be recreated.'
    );

    if (!confirmed) {
      return;
    }

    updateMutation.mutate(
      {
        ids: selectedItems.map((service) => service.Id),
        pullImage: confirmed.pullLatest,
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Service(s) successfully updated');
          router.stateService.reload();
        },
      }
    );
  }

  async function handleRemove(selectedItems: Array<ServiceViewModel>) {
    removeMutation.mutate(
      selectedItems.map((service) => service.Id),
      {
        onSuccess() {
          notifySuccess('Success', 'Service(s) successfully removed');
          router.stateService.reload();
        },
      }
    );
  }
}
