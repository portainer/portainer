import { Authorized } from '@/react/hooks/useUser';

import { AddButton } from '@@/buttons';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { DecoratedStack } from './types';

export function TableActions({
  selectedItems,
  onRemove,
}: {
  selectedItems: Array<DecoratedStack>;
  onRemove: (items: Array<DecoratedStack>) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Authorized authorizations="PortainerStackDelete">
        <DeleteButton
          disabled={selectedItems.length === 0}
          onConfirmed={() => onRemove(selectedItems)}
          confirmMessage="Do you want to remove the selected stack(s)? Associated services will be removed as well."
          data-cy="stack-removeStackButton"
        />
      </Authorized>

      <Authorized authorizations="PortainerStackCreate">
        <AddButton data-cy="stack-addStackButton" to=".newstack">
          Add stack
        </AddButton>
      </Authorized>
    </div>
  );
}
