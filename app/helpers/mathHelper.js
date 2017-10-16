angular.module('portainer.helpers')
.factory('MathHelper', [function MathHelperFactory() {
  'use strict';

  var helper = {};

  helper.getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  return helper;
}]);
