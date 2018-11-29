import _ from 'lodash-es';

angular.module('portainer.app')
.factory('EndpointHelper', [function EndpointHelperFactory() {
  'use strict';
  var helper = {};

  function findAssociatedGroup(endpoint, groups) {
    return _.find(groups, function(group) {
      return group.Id === endpoint.GroupId;
    });
  }

  helper.mapGroupNameToEndpoint = function(endpoints, groups) {
    for (var i = 0; i < endpoints.length; i++) {
      var endpoint = endpoints[i];
      var group = findAssociatedGroup(endpoint, groups);
      if (group) {
        endpoint.GroupName = group.Name;
      }
    }
  };

  return helper;
}]);
