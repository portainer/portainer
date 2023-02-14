import { ModalType } from '@@/modals';
import { ConfirmCallback, openConfirm } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';

export async function confirmImageExport(callback: ConfirmCallback) {
  const result = await openConfirm({
    modalType: ModalType.Warn,
    title: 'Caution',
    message:
      'The export may take several minutes, do not navigate away whilst the export is in progress.',
    confirmButton: buildConfirmButton('Continue'),
  });

  callback(result);
}
