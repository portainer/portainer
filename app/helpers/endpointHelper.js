angular.module('portainer.helpers')
.factory('EndpointHelper', ['MathHelper', function EndpointHelperFactory(MathHelper) {
  'use strict';

  var helper = {},
      MAX_DECIMAL_COLOR = 16777215;

  helper.getRandomHexColor = function() {
    return '#' + MathHelper.getRandomInt(0, MAX_DECIMAL_COLOR).toString(16);
  };
  
  return helper;
}]);
