import { useRouter } from '@uirouter/react';
import { Trash2 } from 'lucide-react';

import { pluralize } from '@/portainer/helpers/strings';

import { confirmDestructive } from '@@/modals/confirm';
import { AddButton, Button } from '@@/buttons';

import { HelmRepository } from './types';
import { useDeleteHelmRepositoriesMutation } from './helm-repositories.service';

interface Props {
  selectedItems: HelmRepository[];
}

export function HelmRepositoryDatatableActions({ selectedItems }: Props) {
  const router = useRouter();
  const deleteHelmRepoMutation = useDeleteHelmRepositoriesMutation();

  return (
    <div className="flex gap-2">
      <Button
        disabled={selectedItems.length < 1}
        color="dangerlight"
        onClick={() => onDeleteClick(selectedItems)}
        data-cy="credentials-deleteButton"
        icon={Trash2}
      >
        Remove
      </Button>

      <AddButton to="portainer.account.createHelmRepository">
        Add Helm repository
      </AddButton>
    </div>
  );

  async function onDeleteClick(selectedItems: HelmRepository[]) {
    const confirmed = await confirmDestructive({
      title: 'Confirm action',
      message: `Are you sure you want to remove the selected Helm ${pluralize(
        selectedItems.length,
        'repository',
        'repositories'
      )}?`,
    });

    if (!confirmed) {
      return;
    }

    deleteHelmRepoMutation.mutate(selectedItems, {
      onSuccess: () => {
        router.stateService.reload();
      },
    });
  }
}
