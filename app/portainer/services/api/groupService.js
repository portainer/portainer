import { EndpointGroupCreateRequest, EndpointGroupModel, EndpointGroupUpdateRequest } from '../../models/group';

angular.module('portainer.app').factory('GroupService', [
  '$q',
  'EndpointGroups',
  function GroupService($q, EndpointGroups) {
    'use strict';
    var service = {};

    service.group = function (groupId) {
      var deferred = $q.defer();

      EndpointGroups.get({ id: groupId })
        .$promise.then(function success(data) {
          var group = new EndpointGroupModel(data);
          deferred.resolve(group);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve group', err: err });
        });

      return deferred.promise;
    };

    service.groups = function () {
      return EndpointGroups.query({}).$promise;
    };

    service.createGroup = function (model, endpoints) {
      var payload = new EndpointGroupCreateRequest(model, endpoints);
      return EndpointGroups.create(payload).$promise;
    };

    service.updateGroup = function (model, endpoints) {
      var payload = new EndpointGroupUpdateRequest(model, endpoints);
      return EndpointGroups.update(payload).$promise;
    };

    service.updateAccess = function (groupId, userAccessPolicies, teamAccessPolicies) {
      return EndpointGroups.updateAccess({ id: groupId }, { UserAccessPolicies: userAccessPolicies, TeamAccessPolicies: teamAccessPolicies }).$promise;
    };

    service.addEndpoint = function (groupId, endpoint) {
      return EndpointGroups.addEndpoint({ id: groupId, action: 'endpoints/' + endpoint.Id }, endpoint).$promise;
    };

    service.removeEndpoint = function (groupId, endpointId) {
      return EndpointGroups.removeEndpoint({ id: groupId, action: 'endpoints/' + endpointId }).$promise;
    };

    service.deleteGroup = function (groupId) {
      return EndpointGroups.remove({ id: groupId }).$promise;
    };

    return service;
  },
]);
