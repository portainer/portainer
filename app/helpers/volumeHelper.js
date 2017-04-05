angular.module('portainer.helpers')
.factory('VolumeHelper', [function VolumeHelperFactory() {
  'use strict';
  var helper = {};

  helper.createDriverOptions = function(optionArray) {
    var options = {};
    optionArray.forEach(function (option) {
      options[option.name] = option.value;
    });
    return options;
  };

  return helper;
}]);
