angular.module('portainer.app')
.factory('EndpointHelper', [function EndpointHelperFactory() {
  'use strict';
  var helper = {};

  helper.mapGroupNameToEndpoint = function(endpoints, groups) {
    for (var i = 0; i < endpoints.length; i++) {
      var endpoint = endpoints[i];
      for (var j = 0; j < groups.length; j++) {
        var group = groups[j];
        if (endpoint.GroupId === group.Id) {
          endpoint.GroupName = group.Name;
          break;
        }
      }
    }
  };

  return helper;
}]);
