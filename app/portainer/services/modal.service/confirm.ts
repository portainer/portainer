import sanitize from 'sanitize-html';
import bootbox from 'bootbox';

import { applyBoxCSS, ButtonsOptions, confirmButtons } from './utils';

type ConfirmCallback = (confirmed: boolean) => void;

interface ConfirmAsyncOptions {
  title: string;
  message: string;
  buttons: ButtonsOptions;
}

interface ConfirmOptions extends ConfirmAsyncOptions {
  callback: ConfirmCallback;
}

export function confirmWebEditorDiscard() {
  const options = {
    title: 'Are you sure ?',
    message:
      'You currently have unsaved changes in the editor. Are you sure you want to leave?',
    buttons: {
      confirm: {
        label: 'Yes',
        className: 'btn-danger',
      },
    },
  };
  return new Promise((resolve) => {
    confirm({
      ...options,
      callback: (confirmed) => resolve(confirmed),
    });
  });
}

export function confirmAsync(options: ConfirmAsyncOptions) {
  return new Promise((resolve) => {
    confirm({
      ...options,
      callback: (confirmed) => resolve(confirmed),
    });
  });
}

export function confirm(options: ConfirmOptions) {
  const box = bootbox.confirm({
    title: options.title,
    message: options.message,
    buttons: confirmButtons(options.buttons),
    callback: options.callback,
  });

  applyBoxCSS(box);
}

export function confirmImageForceRemoval(callback: ConfirmCallback) {
  confirm({
    title: 'Are you sure?',
    message:
      'Forcing the removal of the image will remove the image even if it has multiple tags or if it is used by stopped containers.',
    buttons: {
      confirm: {
        label: 'Remove the image',
        className: 'btn-danger',
      },
    },
    callback,
  });
}

export function cancelRegistryRepositoryAction(callback: ConfirmCallback) {
  confirm({
    title: 'Are you sure?',
    message:
      'WARNING: interrupting this operation before it has finished will result in the loss of all tags. Are you sure you want to do this?',
    buttons: {
      confirm: {
        label: 'Stop',
        className: 'btn-danger',
      },
    },
    callback,
  });
}

export function confirmDeletion(message: string, callback: ConfirmCallback) {
  const messageSanitized = sanitize(message);
  confirm({
    title: 'Are you sure ?',
    message: messageSanitized,
    buttons: {
      confirm: {
        label: 'Remove',
        className: 'btn-danger',
      },
    },
    callback,
  });
}

export function confirmDetachment(message: string, callback: ConfirmCallback) {
  const messageSanitized = sanitize(message);
  confirm({
    title: 'Are you sure ?',
    message: messageSanitized,
    buttons: {
      confirm: {
        label: 'Detach',
        className: 'btn-danger',
      },
    },
    callback,
  });
}

export function confirmDisassociate(callback: ConfirmCallback) {
  const message =
    '<p>Disassociating this Edge environment will mark it as non associated and will clear the registered Edge ID.</p>' +
    '<p>Any agent started with the Edge key associated to this environment will be able to re-associate with this environment.</p>' +
    '<p>You can re-use the Edge ID and Edge key that you used to deploy the existing Edge agent to associate a new Edge device to this environment.</p>';
  confirm({
    title: 'About disassociating',
    message: sanitize(message),
    buttons: {
      confirm: {
        label: 'Disassociate',
        className: 'btn-primary',
      },
    },
    callback,
  });
}

export function confirmUpdate(message: string, callback: ConfirmCallback) {
  const messageSanitized = sanitize(message);

  confirm({
    title: 'Are you sure ?',
    message: messageSanitized,
    buttons: {
      confirm: {
        label: 'Update',
        className: 'btn-warning',
      },
    },
    callback,
  });
}

export function confirmRedeploy(message: string, callback: ConfirmCallback) {
  const messageSanitized = sanitize(message);

  confirm({
    title: '',
    message: messageSanitized,
    buttons: {
      confirm: {
        label: 'Redeploy the applications',
        className: 'btn-primary',
      },
      cancel: {
        label: "I'll do it later",
      },
    },
    callback,
  });
}

export function confirmDeletionAsync(message: string) {
  return new Promise((resolve) => {
    confirmDeletion(message, (confirmed) => resolve(confirmed));
  });
}

export function confirmImageExport(callback: ConfirmCallback) {
  confirm({
    title: 'Caution',
    message:
      'The export may take several minutes, do not navigate away whilst the export is in progress.',
    buttons: {
      confirm: {
        label: 'Continue',
        className: 'btn-primary',
      },
    },
    callback,
  });
}

export function confirmChangePassword() {
  return confirmAsync({
    title: 'Are you sure?',
    message:
      'You will be logged out after the password change. Do you want to change your password?',
    buttons: {
      confirm: {
        label: 'Change',
        className: 'btn-primary',
      },
    },
  });
}

export function confirmForceChangePassword() {
  const box = bootbox.dialog({
    message:
      'Please update your password to a stronger password to continue using Portainer',
    buttons: {
      confirm: {
        label: 'OK',
        className: 'btn-primary',
      },
    },
  });

  applyBoxCSS(box);
}
