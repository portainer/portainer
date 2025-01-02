import { useRouter } from '@uirouter/react';

import { pluralize } from '@/portainer/helpers/strings';

import { AddButton } from '@@/buttons';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { HelmRepository } from './types';
import { useDeleteHelmRepositoriesMutation } from './helm-repositories.service';

interface Props {
  selectedItems: HelmRepository[];
}

export function HelmRepositoryDatatableActions({ selectedItems }: Props) {
  const router = useRouter();
  const deleteHelmRepoMutation = useDeleteHelmRepositoriesMutation();

  return (
    <>
      <DeleteButton
        disabled={selectedItems.length === 0}
        onConfirmed={() => onDeleteClick(selectedItems)}
        confirmMessage={`Are you sure you want to remove the selected Helm ${pluralize(
          selectedItems.length,
          'repository',
          'repositories'
        )}?`}
        data-cy="helmRepository-deleteButton"
      />
      <AddButton
        to="portainer.account.createHelmRepository"
        data-cy="helmRepository-addButton"
      >
        Add Helm repository
      </AddButton>
    </>
  );

  async function onDeleteClick(selectedItems: HelmRepository[]) {
    deleteHelmRepoMutation.mutate(selectedItems, {
      onSuccess: () => {
        router.stateService.reload();
      },
    });
  }
}
