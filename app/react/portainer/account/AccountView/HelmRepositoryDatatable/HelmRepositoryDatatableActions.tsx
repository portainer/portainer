import { useRouter } from '@uirouter/react';
import { Plus, Trash2 } from 'lucide-react';

import { pluralize } from '@/portainer/helpers/strings';

import { confirmDestructive } from '@@/modals/confirm';
import { Icon } from '@@/Icon';
import { Button } from '@@/buttons';

import { HelmRepository } from './types';
import { useDeleteHelmRepositoryMutation } from './helm-repositories.service';

interface Props {
  selectedItems: HelmRepository[];
}

export function HelmRepositoryDatatableActions({ selectedItems }: Props) {
  const router = useRouter();
  const deleteHelmRepoMutation = useDeleteHelmRepositoryMutation();

  return (
    <>
      <Button
        disabled={selectedItems.length < 1}
        color="dangerlight"
        onClick={() => onDeleteClick(selectedItems)}
        data-cy="credentials-deleteButton"
      >
        <Icon icon={Trash2} className="vertical-center" />
        Remove
      </Button>

      <Button
        onClick={() =>
          router.stateService.go('portainer.account.createHelmRepository')
        }
        data-cy="credentials-addButton"
      >
        <Icon icon={Plus} className="vertical-center" />
        Add Helm Repository
      </Button>
    </>
  );

  async function onDeleteClick(selectedItems: HelmRepository[]) {
    const confirmed = await confirmDestructive({
      title: 'Confirm action',
      message: `Are you sure you want to remove the selected helm ${pluralize(
        selectedItems.length,
        'repository',
        'repositories'
      )}?`,
    });

    if (!confirmed) {
      return;
    }

    selectedItems.forEach((item) => {
      deleteHelmRepoMutation.mutate(item);
    });
  }
}
