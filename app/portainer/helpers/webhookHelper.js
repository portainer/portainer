import angular from 'angular';

import { API_ENDPOINT_WEBHOOKS } from '@/constants';

angular.module('portainer.app').factory('WebhookHelper', [
  '$location',
  function WebhookHelperFactory($location) {
    'use strict';
    var helper = {};

    helper.returnWebhookUrl = function (token) {
      var displayPort =
        ($location.protocol().toLowerCase() === 'http' && $location.port() === 80) || ($location.protocol().toLowerCase() === 'https' && $location.port() === 443)
          ? ''
          : ':' + $location.port();

      return `${$location.protocol()}://${$location.host()}${displayPort}/${API_ENDPOINT_WEBHOOKS}/${token}`;
    };

    return helper;
  },
]);
