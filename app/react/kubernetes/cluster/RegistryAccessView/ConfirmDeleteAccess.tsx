import { confirmDestructive } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';

export function confirmDeleteAccess() {
  return confirmDestructive({
    title: 'Are you sure?',
    message: (
      <>
        <p>
          This registry might be used by one or more applications inside this
          environment. Removing the registry access could lead to a service
          interruption for these applications.
        </p>
        <p>Are you sure you wish to continue?</p>
      </>
    ),
    confirmButton: buildConfirmButton('Remove', 'danger'),
  });
}
