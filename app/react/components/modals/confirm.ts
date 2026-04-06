import { ReactNode } from 'react';

import i18n from '@/i18n';

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
    title: i18n.t('common.are_you_sure'),
    message: i18n.t('confirm.unsaved_editor'),
    confirmButton: buildConfirmButton(i18n.t('common.yes'), 'danger'),
  });
}

export function confirmGenericDiscard() {
  return openConfirm({
    modalType: ModalType.Warn,
    title: i18n.t('common.are_you_sure'),
    message: i18n.t('confirm.unsaved_generic'),
    confirmButton: buildConfirmButton(i18n.t('common.yes'), 'danger'),
  });
}

export function confirmDelete(message: ReactNode) {
  return confirmDestructive({
    title: i18n.t('common.are_you_sure'),
    message,
    confirmButton: buildConfirmButton(i18n.t('common.remove'), 'danger'),
  });
}

export async function confirmUpdate(
  message: string,
  callback: ConfirmCallback
) {
  const result = await openConfirm({
    title: i18n.t('common.are_you_sure'),
    modalType: ModalType.Warn,
    message,
    confirmButton: buildConfirmButton(i18n.t('common.update')),
  });

  callback(result);

  return result;
}

export function confirmChangePassword() {
  return openConfirm({
    modalType: ModalType.Warn,
    title: i18n.t('common.are_you_sure'),
    message: i18n.t('confirm.change_password'),
    confirmButton: buildConfirmButton(i18n.t('common.change')),
  });
}
