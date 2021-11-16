angular.module('portainer.app').factory('DockerHelper', [
  function DockerHelperFactory() {
    'use strict';
    var helper = {};

    helper.shortenContainerId = function (containerId) {
      return containerId && containerId.substr(0, 12);
    };

    return helper;
  },
]);
