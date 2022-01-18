import sanitize from 'sanitize-html';

interface Button {
  label: string;
  className?: string;
}

export interface ButtonsOptions {
  confirm: Button;
  cancel?: Button;
}

export function confirmButtons(options: ButtonsOptions) {
  return {
    confirm: {
      label: sanitize(options.confirm.label),
      className:
        options.confirm.className && sanitize(options.confirm.className),
    },
    cancel: {
      label:
        options.cancel && options.cancel.label
          ? sanitize(options.cancel.label)
          : 'Cancel',
    },
  };
}

export function applyBoxCSS(box: JQuery<HTMLElement>) {
  box.css({
    top: '50%',
    'margin-top': function marginTop() {
      const height = box.height() || 0;
      return -(height / 2);
    },
  });
}
