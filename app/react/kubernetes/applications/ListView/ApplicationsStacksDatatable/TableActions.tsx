import { Authorized } from '@/react/hooks/useUser';

import { DeleteButton } from '@@/buttons/DeleteButton';

import { Stack } from './types';

export function TableActions({
  selectedItems,
  onRemove,
}: {
  selectedItems: Array<Stack>;
  onRemove: (selectedItems: Array<Stack>) => void;
}) {
  return (
    <Authorized authorizations="K8sApplicationsW">
      <DeleteButton
        confirmMessage="Are you sure that you want to remove the selected stack(s) ? This will remove all the applications associated to the stack(s)."
        disabled={selectedItems.length === 0}
        onConfirmed={() => onRemove(selectedItems)}
        data-cy="k8sApp-removeStackButton"
      />
    </Authorized>
  );
}
