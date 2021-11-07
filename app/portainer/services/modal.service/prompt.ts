import sanitize from 'sanitize-html';
import bootbox from 'bootbox';

import { applyBoxCSS, ButtonsOptions, confirmButtons } from './utils';

type PromptCallback = ((value: string) => void) | ((value: string[]) => void);

interface InputOption {
  text: string;
  value: string;
}

interface PromptOptions {
  title: string;
  inputType?:
    | 'text'
    | 'textarea'
    | 'email'
    | 'select'
    | 'checkbox'
    | 'date'
    | 'time'
    | 'number'
    | 'password'
    | 'radio'
    | 'range';
  inputOptions: InputOption[];
  buttons: ButtonsOptions;
  value?: string;
  callback: PromptCallback;
}

export function prompt(options: PromptOptions) {
  const box = bootbox.prompt({
    title: options.title,
    inputType: options.inputType,
    inputOptions: options.inputOptions,
    buttons: confirmButtons(options.buttons),
    // casting is done because ts definition expects string=>any, but library code can emit different values, based on inputType
    callback: options.callback as (value: string) => void,
    value: options.value,
  });

  applyBoxCSS(box);

  return box;
}

export function confirmContainerDeletion(
  title: string,
  callback: PromptCallback
) {
  const sanitizedTitle = sanitize(title);

  prompt({
    title: sanitizedTitle,
    inputType: 'checkbox',
    inputOptions: [
      {
        text: 'Automatically remove non-persistent volumes<i></i>',
        value: '1',
      },
    ],
    buttons: {
      confirm: {
        label: 'Remove',
        className: 'btn-danger',
      },
    },
    callback,
  });
}

export function selectRegistry(options: PromptOptions) {
  prompt(options);
}

export function confirmContainerRecreation(callback: PromptCallback) {
  const box = prompt({
    title: 'Are you sure?',

    inputType: 'checkbox',
    inputOptions: [
      {
        text: 'Pull latest image<i></i>',
        value: '1',
      },
    ],
    buttons: {
      confirm: {
        label: 'Recreate',
        className: 'btn-danger',
      },
    },
    callback,
  });

  const message = `You're about to re-create this container, any non-persisted data will be lost. This container will be removed and another one will be created using the same configuration.`;

  customizePrompt(box, message, false);
}

export function confirmServiceForceUpdate(
  message: string,
  callback: PromptCallback
) {
  const sanitizedMessage = sanitize(message);

  const box = prompt({
    title: 'Are you sure?',
    inputType: 'checkbox',
    inputOptions: [
      {
        text: 'Pull latest image version<i></i>',
        value: '1',
      },
    ],
    buttons: {
      confirm: {
        label: 'Update',
        className: 'btn-primary',
      },
    },
    callback,
  });

  customizePrompt(box, sanitizedMessage, false);
}

function customizePrompt(
  box: JQuery<HTMLElement>,
  message: string,
  toggleCheckbox: boolean
) {
  box.find('.bootbox-body').prepend(`<p>${message}</p>`);
  box.find('.bootbox-input-checkbox').prop('checked', toggleCheckbox);
}
