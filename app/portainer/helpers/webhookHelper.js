angular.module('portainer.app')
.factory('WebhookHelper', ['$location', 'API_ENDPOINT_WEBHOOKS', function WebhookHelperFactory($location,API_ENDPOINT_WEBHOOKS) {
  'use strict';
  var helper = {};

  helper.returnWebhookUrl = function(token) {
    return $location.protocol() + "://" +  $location.host() + ":"
    + $location.port() + "/" + API_ENDPOINT_WEBHOOKS + "/" + token;
  };

  return helper;
}]);
