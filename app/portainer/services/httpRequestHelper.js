angular.module('portainer.app')
.factory('HttpRequestHelper', [function HttpRequestHelper() {
  'use strict';

  var service = {};
  var headers = {};
  headers.agentTargetQueue = [];
  headers.agentManagerOperation = false;

  service.registryAuthenticationHeader = function() {
    return headers.registryAuthentication;
  };

  service.setRegistryAuthenticationHeader = function(headerValue) {
    headers.registryAuthentication = headerValue;
  };

  // Due to the fact that async HTTP requests are decorated using an interceptor
  // we need to store and retrieve the headers using a first-in-first-out (FIFO) data structure.
  // Otherwise, sequential HTTP requests might end up using the same header value (incorrect in the case
  // of starting multiple containers on different nodes for example).
  // To prevent having to use the HttpRequestHelper.setPortainerAgentTargetHeader before EACH request,
  // we re-use the latest available header in the data structure (handy in thee case of multiple requests affecting
  // the same node in the same view).
  service.portainerAgentTargetHeader = function() {
    if (headers.agentTargetQueue.length === 0) {
      return headers.agentTargetLastValue;
    } else if (headers.agentTargetQueue.length === 1) {
      headers.agentTargetLastValue = headers.agentTargetQueue[0];
    }
    return headers.agentTargetQueue.shift();
  };

  service.setPortainerAgentTargetHeader = function(headerValue) {
    if (headerValue) {
      headers.agentTargetQueue.push(headerValue);
    }
  };

  service.setPortainerAgentManagerOperation = function(set) {
    headers.agentManagerOperation = set;
  };

  service.portainerAgentManagerOperation = function() {
    return headers.agentManagerOperation;
  };

  service.resetAgentHeaders = function() {
    headers.agentTargetQueue = [];
    delete headers.agentTargetLastValue;
    headers.agentManagerOperation = false;
  };

  return service;
}]);
