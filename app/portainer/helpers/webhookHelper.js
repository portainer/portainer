angular.module('portainer.app').factory('WebhookHelper', [
  '$location',
  'API_ENDPOINT_WEBHOOKS',
  'API_ENDPOINT_STACKS',
  function WebhookHelperFactory($location, API_ENDPOINT_WEBHOOKS, API_ENDPOINT_STACKS) {
    'use strict';
    var helper = {};

    helper.returnWebhookUrl = function (token) {
      var displayPort =
        ($location.protocol().toLowerCase() === 'http' && $location.port() === 80) || ($location.protocol().toLowerCase() === 'https' && $location.port() === 443)
          ? ''
          : ':' + $location.port();
      return $location.protocol() + '://' + $location.host() + displayPort + '/' + API_ENDPOINT_WEBHOOKS + '/' + token;
    };

    helper.returnStackWebhookUrl = function (token) {
      var displayPort =
        ($location.protocol().toLowerCase() === 'http' && $location.port() === 80) || ($location.protocol().toLowerCase() === 'https' && $location.port() === 443)
          ? ''
          : ':' + $location.port();
      return $location.protocol() + '://' + $location.host() + displayPort + '/' + API_ENDPOINT_STACKS + '/' + 'webhooks' + '/' + token;
    };

    return helper;
  },
]);
