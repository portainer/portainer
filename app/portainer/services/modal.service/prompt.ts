import sanitize from 'sanitize-html';
import bootbox from 'bootbox';

import {
  applyBoxCSS,
  ButtonsOptions,
  confirmButtons,
  buildTitle,
  ModalTypeIcon,
} from './utils';

type PromptCallback = ((value: string) => void) | ((value: string[]) => void);

interface InputOption {
  text: string;
  value: string;
}

interface PromptOptions {
  title: string;
  message?: string;
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

export async function promptAsync(options: Omit<PromptOptions, 'callback'>) {
  return new Promise((resolve) => {
    prompt({
      ...options,
      callback: (result: string | string[]) => resolve(result),
    });
  });
}

// the ts-ignore is required because the bootbox typings are not up to date
// remove the ts-ignore when the typings are updated in
export function prompt(options: PromptOptions) {
  const box = bootbox.prompt({
    title: options.title,
    inputType: options.inputType,
    inputOptions: options.inputOptions,
    buttons: options.buttons ? confirmButtons(options.buttons) : undefined,
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
  prompt({
    title: buildTitle(title, ModalTypeIcon.Destructive),
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

export function confirmUpdateAppIngress(
  title: string,
  message: string,
  inputText: string,
  callback: PromptCallback
) {
  prompt({
    title: buildTitle(title),
    inputType: 'checkbox',
    message,
    inputOptions: [
      {
        text: `${inputText}<i></i>`,
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
}

export function selectRegistry(options: PromptOptions) {
  prompt(options);
}

export function confirmContainerRecreation(
  cannotPullImage: boolean | null,
  callback: PromptCallback
) {
  const box = prompt({
    title: buildTitle('Are you sure?', ModalTypeIcon.Destructive),

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

  const message = `You're about to recreate this container and any non-persisted data will be lost. This container will be removed and another one will be created using the same configuration.`;
  box.find('.bootbox-body').prepend(`<p>${message}</p>`);
  const label = box.find('.form-check-label');
  label.css('padding-left', '5px');
  label.css('padding-right', '25px');

  if (cannotPullImage) {
    label.css('cursor', 'not-allowed');
    label.find('i').css('cursor', 'not-allowed');
    const checkbox = box.find('.bootbox-input-checkbox');
    checkbox.prop('disabled', true);
    const formCheck = box.find('.form-check');
    formCheck.prop('style', 'height: 45px;');
    const cannotPullImageMessage = `<div class="fa fa-exclamation-triangle text-warning"/>
               <div class="inline-text text-warning">
                   <span>Cannot pull latest as the image is inaccessible - either it no longer exists or the tag or name is no longer correct.
                   </span>
               </div>`;
    formCheck.append(`${cannotPullImageMessage}`);
  }
}

export function confirmServiceForceUpdate(
  message: string,
  callback: PromptCallback
) {
  const sanitizedMessage = sanitize(message);

  const box = prompt({
    title: buildTitle('Are you sure?'),
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

  customizeCheckboxPrompt(box, sanitizedMessage);
}

export function confirmStackUpdate(
  message: string,
  defaultToggle: boolean,
  confirmButtonClass: string | undefined,
  callback: PromptCallback
) {
  const sanitizedMessage = sanitize(message);

  const box = prompt({
    title: buildTitle('Are you sure?'),
    inputType: 'checkbox',
    inputOptions: [
      {
        text: 'Re-pull image and redeploy<i></i>',
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

  customizeCheckboxPrompt(box, sanitizedMessage, defaultToggle);
}

function customizeCheckboxPrompt(
  box: JQuery<HTMLElement>,
  message: string,
  toggleCheckbox = false,
  showCheck = false
) {
  box.find('.bootbox-body').prepend(`<p>${message}</p>`);
  const checkbox = box.find('.bootbox-input-checkbox');
  checkbox.prop('checked', toggleCheckbox);

  if (showCheck) {
    checkbox.addClass('visible');
  }
}
