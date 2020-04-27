angular.module('portainer.app').factory('FormHelper', [
  function FormHelperFactory() {
    'use strict';
    var helper = {};

    helper.removeInvalidEnvVars = function (env) {
      for (var i = env.length - 1; i >= 0; i--) {
        var envvar = env[i];
        if (!envvar.value || !envvar.name) {
          env.splice(i, 1);
        }
      }

      return env;
    };

    return helper;
  },
]);
