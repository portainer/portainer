import _ from 'lodash-es';
import toastr from 'toastr';
import lodash from 'lodash-es';

angular.module('portainer.app').factory('Notifications', [
  '$sanitize',
  function NotificationsFactory($sanitize) {
    'use strict';
    var service = {};

    service.success = function (title, text) {
      toastr.success($sanitize(_.escape(text)), $sanitize(title));
    };

    service.warning = function (title, text) {
      toastr.warning($sanitize(_.escape(text)), $sanitize(title), { timeOut: 6000 });
    };

    function pickErrorMsg(e) {
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

      lodash.forEach(props, (prop) => {
        const val = lodash.get(e, prop);
        if (typeof val === 'string') {
          msg = msg || val;
        }
      });

      return msg;
    }

    service.error = function (title, e, fallbackText) {
      const msg = pickErrorMsg(e) || fallbackText;

      // eslint-disable-next-line no-console
      console.error(e);

      if (msg !== 'Invalid JWT token') {
        toastr.error($sanitize(_.escape(msg)), $sanitize(title), { timeOut: 6000 });
      }
    };

    return service;
  },
]);
