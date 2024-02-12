import { Trash2, Plus, RefreshCw } from 'lucide-react';
import { useRouter } from '@uirouter/react';

import { ServiceViewModel } from '@/docker/models/service';
import { Authorized } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { notifySuccess } from '@/portainer/services/notifications';

import { Link } from '@@/Link';
import { Button, ButtonGroup } from '@@/buttons';
import { confirmDelete } from '@@/modals/confirm';

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
          <Button
            color="dangerlight"
            disabled={selectedItems.length === 0}
            onClick={() => handleRemove(selectedItems)}
            icon={Trash2}
            data-cy="service-removeServiceButton"
          >
            Remove
          </Button>
        </Authorized>
      </ButtonGroup>

      {isAddActionVisible && (
        <Authorized authorizations="DockerServiceCreate">
          <Button
            as={Link}
            props={{ to: '.new' }}
            icon={Plus}
            className="!ml-0"
          >
            Add service
          </Button>
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
    const confirmed = await confirmDelete(
      'Do you want to remove the selected service(s)? All the containers associated to the selected service(s) will be removed too.'
    );

    if (!confirmed) {
      return;
    }

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
