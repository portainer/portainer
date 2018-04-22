angular.module('portainer.app')
.factory('GroupService', ['$q', 'EndpointGroups',
function GroupService($q, EndpointGroups) {
  'use strict';
  var service = {};

  service.group = function(groupId) {
    return EndpointGroups.get({ id: groupId }).$promise;
  };

  service.groups = function() {
    return EndpointGroups.query({}).$promise;
  };

  service.updateAccess = function(id, authorizedUserIDs, authorizedTeamIDs) {
    return EndpointGroups.updateAccess({ id: id }, { authorizedUsers: authorizedUserIDs, authorizedTeams: authorizedTeamIDs }).$promise;
  };

  service.updateGroup = function(id, endpointParams) {
  };

  service.deleteGroup = function(groupId) {
  };

  return service;
}]);
