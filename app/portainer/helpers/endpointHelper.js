import _ from 'lodash-es';

angular.module('portainer.app').factory('EndpointHelper', [
  function EndpointHelperFactory() {
    'use strict';
    var helper = {};

    function findAssociatedGroup(endpoint, groups) {
      return _.find(groups, function (group) {
        return group.Id === endpoint.GroupId;
      });
    }

    helper.isLocalEndpoint = isLocalEndpoint;
    function isLocalEndpoint(endpoint) {
      return endpoint.URL.includes('unix://') || endpoint.URL.includes('npipe://') || endpoint.Type === 5;
    }

    helper.isAgentEndpoint = isAgentEndpoint;
    function isAgentEndpoint(endpoint) {
      return [2, 4, 6, 7].includes(endpoint.Type);
    }

    helper.mapGroupNameToEndpoint = function (endpoints, groups) {
      for (var i = 0; i < endpoints.length; i++) {
        var endpoint = endpoints[i];
        var group = findAssociatedGroup(endpoint, groups);
        if (group) {
          endpoint.GroupName = group.Name;
        }
      }
    };

    return helper;
  },
]);
