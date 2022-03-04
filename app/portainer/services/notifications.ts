import _ from 'lodash-es';
import toastr from 'toastr';
import sanitize from 'sanitize-html';

toastr.options = {
  timeOut: 3000,
  closeButton: true,
  progressBar: true,
  tapToDismiss: false,
};

export function success(title: string, text: string) {
  toastr.success(sanitize(_.escape(text)), sanitize(title));
}

export function warning(title: string, text: string) {
  toastr.warning(sanitize(_.escape(text)), sanitize(title), { timeOut: 6000 });
}

export function error(title: string, e?: Error, fallbackText = '') {
  const msg = pickErrorMsg(e) || fallbackText;

  // eslint-disable-next-line no-console
  console.error(e);

  if (msg !== 'Invalid JWT token') {
    toastr.error(sanitize(_.escape(msg)), sanitize(title), { timeOut: 6000 });
  }
}

/* @ngInject */
export function Notifications() {
  return {
    success,
    warning,
    error,
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
