import { openSwitchPrompt } from '@@/modals/SwitchPrompt';
import { ModalType } from '@@/modals';
import { buildConfirmButton } from '@@/modals/utils';

export async function confirmServiceForceUpdate(message: string) {
  const result = await openSwitchPrompt('Are you sure?', 'Re-pull image', {
    message,
    confirmButton: buildConfirmButton('Update'),
    modalType: ModalType.Warn,
  });

  return result ? { pullLatest: result.value } : undefined;
}
