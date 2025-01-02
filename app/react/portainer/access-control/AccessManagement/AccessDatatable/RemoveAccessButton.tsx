import { DeleteButton } from '@@/buttons/DeleteButton';

import { Access } from './types';

export function RemoveAccessButton({
  onClick,
  items,
}: {
  onClick(items: Array<Access>): void;
  items: Array<Access>;
}) {
  return (
    <DeleteButton
      confirmMessage="Are you sure you want to unauthorized the selected users or teams?"
      onConfirmed={() => onClick(items)}
      disabled={items.length === 0}
      data-cy="remove-access-button"
    />
  );
}
