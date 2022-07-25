import _ from 'lodash';
import toastr from 'toastr';
import sanitize from 'sanitize-html';

toastr.options = {
  timeOut: 3000,
  closeButton: true,
  progressBar: true,
  tapToDismiss: false,
};

export function notifySuccess(title: string, text?: string) {
  toastr.success(sanitize(_.escape(text)), sanitize(title));
}

export function notifyWarning(title: string, text: string) {
  toastr.warning(sanitize(_.escape(text)), sanitize(title), { timeOut: 6000 });
}

export function notifyError(title: string, e?: Error, fallbackText = '') {
  const msg = pickErrorMsg(e) || fallbackText;

  // eslint-disable-next-line no-console
  console.error(e);

  if (msg !== 'Invalid JWT token') {
    toastr.error(sanitize(_.escape(msg)), sanitize(title), { timeOut: 6000 });
  }
}

export const success = notifySuccess;
export const error = notifyError;
export const warning = notifyWarning;

/* @ngInject */
export function Notifications() {
  return {
    success: notifySuccess,
    warning: notifyWarning,
    error: notifyError,
  };
}

function pickErrorMsg(e?: Error) {
  if (!e) {
    return '';
  }

  const props = [
    'err.data.details',
    'err.data.message',
    'data.details',
    'data.message',
    'data.content',
    'data.error',
    'message',
    'err.data[0].message',
    'err.data.err',
    'data.err',
    'msg',
  ];

  let msg = '';

  props.forEach((prop) => {
    const val = _.get(e, prop);
    if (typeof val === 'string') {
      msg = msg || val;
    }
  });

  return msg;
}
