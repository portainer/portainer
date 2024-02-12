import { useRouter } from '@uirouter/react';
import { Plus, Trash2 } from 'lucide-react';

import { pluralize } from '@/portainer/helpers/strings';

import { confirmDestructive } from '@@/modals/confirm';
import { Button } from '@@/buttons';

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
      <Button
        disabled={selectedItems.length < 1}
        color="dangerlight"
        onClick={() => onDeleteClick(selectedItems)}
        data-cy="credentials-deleteButton"
        icon={Trash2}
      >
        Remove
      </Button>

      <Button
        onClick={() =>
          router.stateService.go('portainer.account.createHelmRepository')
        }
        data-cy="credentials-addButton"
        icon={Plus}
      >
        Add Helm repository
      </Button>
    </>
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
