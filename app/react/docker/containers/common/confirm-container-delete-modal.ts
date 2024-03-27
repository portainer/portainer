import { ModalType } from '@@/modals';
import { openSwitchPrompt } from '@@/modals/SwitchPrompt';
import { buildConfirmButton } from '@@/modals/utils';

export async function confirmContainerDeletion(title: string) {
  const result = await openSwitchPrompt(
    title,
    'Automatically remove non-persistent volumes',
    {
      confirmButton: buildConfirmButton('Remove', 'danger'),
      modalType: ModalType.Destructive,
      'data-cy': 'confirm-container-delete-button',
    }
  );

  return result ? { removeVolumes: result.value } : undefined;
}
