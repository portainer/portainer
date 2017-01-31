angular.module('portainer.services')
.factory('Messages', ['$sanitize', function MessagesFactory($sanitize) {
  'use strict';
  return {
    send: function (title, text) {
      $.gritter.add({
        title: $sanitize(title),
        text: $sanitize(text),
        time: 2000,
        before_open: function () {
          if ($('.gritter-item-wrapper').length === 3) {
            return false;
          }
        }
      });
    },
    error: function (title, e, fallbackText) {
      var msg = fallbackText;
      if (e.data && e.data.message) {
        msg = e.data.message;
      } else if (e.message) {
        msg = e.message;
      } else if (e.data && e.data.length > 0 && e.data[0].message) {
        msg = e.data[0].message;
      }
      $.gritter.add({
        title: $sanitize(title),
        text: $sanitize(msg),
        time: 10000,
        before_open: function () {
          if ($('.gritter-item-wrapper').length === 4) {
            return false;
          }
        }
      });
    }
  };
}]);
