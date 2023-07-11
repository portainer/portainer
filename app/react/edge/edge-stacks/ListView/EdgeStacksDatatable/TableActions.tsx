import { Trash2, Plus } from 'lucide-react';

import { notifySuccess } from '@/portainer/services/notifications';

import { Button } from '@@/buttons';
import { confirmDestructive } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';
import { Link } from '@@/Link';

import { useDeleteEdgeStacksMutation } from './useDeleteEdgeStacksMutation';
import { DecoratedEdgeStack } from './types';

export function TableActions({
  selectedItems,
}: {
  selectedItems: Array<DecoratedEdgeStack>;
}) {
  const removeMutation = useDeleteEdgeStacksMutation();

  return (
    <div className="flex items-center gap-2">
      <Button
        color="dangerlight"
        disabled={selectedItems.length === 0}
        onClick={() => handleRemove(selectedItems)}
        icon={Trash2}
        className="!m-0"
      >
        Remove
      </Button>

      <Button
        as={Link}
        props={{ to: 'edge.stacks.new' }}
        icon={Plus}
        className="!m-0"
        data-cy="edgeStack-addStackButton"
      >
        Add stack
      </Button>
    </div>
  );

  async function handleRemove(selectedItems: Array<DecoratedEdgeStack>) {
    const confirmed = await confirmDestructive({
      title: 'Are you sure?',
      message: 'Are you sure you want to remove the selected Edge stack(s)?',
      confirmButton: buildConfirmButton('Remove', 'danger'),
    });

    if (!confirmed) {
      return;
    }

    const ids = selectedItems.map((item) => item.Id);
    removeMutation.mutate(ids, {
      onSuccess: () => {
        notifySuccess('Success', 'Edge stack(s) removed');
      },
    });
  }
}
