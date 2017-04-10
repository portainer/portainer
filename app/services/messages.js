angular.module('portainer.services')
.factory('Messages', ['$sanitize', function MessagesFactory($sanitize) {
  'use strict';
  var service = {};

  service.success = function(title, text) {
    toastr.success($sanitize(text), $sanitize(title));
  };

  service.warning = function(title, text) {
    toastr.success($sanitize(text), $sanitize(title));
  };

  service.info = function(title, text) {
    toastr.info($sanitize(text), $sanitize(title));
  };

  service.error = function(title, e, fallbackText) {
    var msg = fallbackText;
    if (e.data && e.data.message) {
      msg = e.data.message;
    } else if (e.message) {
      msg = e.message;
    } else if (e.data && e.data.length > 0 && e.data[0].message) {
      msg = e.data[0].message;
    } else if (e.msg) {
      msg = e.msg;
    }
    toastr.error($sanitize(msg), $sanitize(title), {timeOut: 6000});
  };

  service.send = function(title, text) {
    toastr.success($sanitize(text), $sanitize(title));
  };

  return service;
}]);
