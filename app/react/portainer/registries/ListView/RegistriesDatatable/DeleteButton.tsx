import { pluralize } from '@/portainer/helpers/strings';
import { notifySuccess } from '@/portainer/services/notifications';

import { DeleteButton as BaseDeleteButton } from '@@/buttons/DeleteButton';

import { Registry } from '../../types/registry';

import { useDeleteRegistriesMutation } from './useDeleteRegistriesMutation';

export function DeleteButton({ selectedItems }: { selectedItems: Registry[] }) {
  const mutation = useDeleteRegistriesMutation();

  const confirmMessage = getMessage(selectedItems.length);

  return (
    <BaseDeleteButton
      data-cy="registry-removeRegistryButton"
      disabled={selectedItems.length === 0}
      confirmMessage={confirmMessage}
      onConfirmed={handleDelete}
    />
  );

  function handleDelete() {
    mutation.mutate(
      selectedItems.map((item) => item.Id),
      {
        onSuccess() {
          notifySuccess('Success', 'Registries removed');
        },
      }
    );
  }
}

function getMessage(selectedCount: number) {
  const regAttrMsg = selectedCount > 1 ? 'hese' : 'his';
  const registriesMsg = pluralize(selectedCount, 'registry', 'registries');
  return `T${regAttrMsg} ${registriesMsg} might be used by applications inside one or more environments. Removing the ${registriesMsg} could lead to a service interruption for the applications using t${regAttrMsg} ${registriesMsg}. Do you want to remove the selected ${registriesMsg}?`;
}
