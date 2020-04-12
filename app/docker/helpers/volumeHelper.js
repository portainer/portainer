angular.module('portainer.docker').factory('VolumeHelper', [
  function VolumeHelperFactory() {
    'use strict';
    var helper = {};

    helper.createDriverOptions = function (optionArray) {
      var options = {};
      optionArray.forEach(function (option) {
        options[option.name] = option.value;
      });
      return options;
    };

    helper.isVolumeUsedByAService = function (volume, services) {
      for (var i = 0; i < services.length; i++) {
        var service = services[i];
        var mounts = service.Mounts;
        for (var j = 0; j < mounts.length; j++) {
          var mount = mounts[j];
          if (mount.Source === volume.Id) {
            return true;
          }
        }
      }

      return false;
    };

    return helper;
  },
]);
