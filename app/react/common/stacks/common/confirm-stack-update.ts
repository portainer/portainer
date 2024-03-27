import { openSwitchPrompt } from '@@/modals/SwitchPrompt';
import { ModalType } from '@@/modals';
import { buildConfirmButton } from '@@/modals/utils';

export async function confirmStackUpdate(
  message: string,
  defaultValue: boolean
) {
  const result = await openSwitchPrompt(
    'Are you sure?',
    'Re-pull image and redeploy',
    {
      message,
      confirmButton: buildConfirmButton('Update'),
      modalType: ModalType.Warn,
      defaultValue,
      'data-cy': 'confirm-stack-update',
    }
  );

  return result ? { pullImage: result.value } : undefined;
}
