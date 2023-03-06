import { ReactNode } from 'react';

import { openDialog, DialogOptions } from './Dialog';
import { OnSubmit, ModalType } from './Modal';
import { ButtonOptions } from './types';
import { buildCancelButton, buildConfirmButton } from './utils';

export type ConfirmCallback = OnSubmit<boolean>;

export interface ConfirmOptions
  extends Omit<DialogOptions<boolean>, 'title' | 'buttons'> {
  title: string;
  confirmButton?: ButtonOptions<true>;
  cancelButtonLabel?: string;
}

export async function openConfirm({
  confirmButton = buildConfirmButton(),
  cancelButtonLabel,
  ...options
}: ConfirmOptions) {
  const result = await openDialog({
    ...options,
    buttons: [buildCancelButton(cancelButtonLabel), confirmButton],
  });
  return !!result;
}

export function confirm(options: ConfirmOptions) {
  return openConfirm(options);
}

export function confirmDestructive(options: Omit<ConfirmOptions, 'modalType'>) {
  return openConfirm({
    ...options,
    modalType: ModalType.Destructive,
  });
}

export function confirmWebEditorDiscard() {
  return openConfirm({
    modalType: ModalType.Warn,
    title: 'Are you sure?',
    message:
      'You currently have unsaved changes in the editor. Are you sure you want to leave?',
    confirmButton: buildConfirmButton('Yes', 'danger'),
  });
}

export function confirmDelete(message: ReactNode) {
  return confirmDestructive({
    title: 'Are you sure?',
    message,
    confirmButton: buildConfirmButton('Remove', 'danger'),
  });
}

export async function confirmUpdate(
  message: string,
  callback: ConfirmCallback
) {
  const result = await openConfirm({
    title: 'Are you sure?',
    modalType: ModalType.Warn,
    message,
    confirmButton: buildConfirmButton('Update'),
  });

  callback(result);

  return result;
}

export function confirmChangePassword() {
  return openConfirm({
    modalType: ModalType.Warn,
    title: 'Are you sure?',
    message:
      'You will be logged out after the password change. Do you want to change your password?',
    confirmButton: buildConfirmButton('Change'),
  });
}
