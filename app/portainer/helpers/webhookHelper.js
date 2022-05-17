import { baseHref } from '@/portainer/helpers/pathHelper';

angular.module('portainer.app').factory('WebhookHelper', [
  '$location',
  'API_ENDPOINT_WEBHOOKS',
  'API_ENDPOINT_STACKS',
  function WebhookHelperFactory($location, API_ENDPOINT_WEBHOOKS, API_ENDPOINT_STACKS) {
    'use strict';

    var helper = {};
    let base;
    const protocol = $location.protocol().toLowerCase();

    if (protocol !== 'file') {
      const host = $location.host();
      const port = $location.port();
      const displayPort = (protocol === 'http' && port === 80) || (protocol === 'https' && port === 443) ? '' : ':' + port;
      base = `${protocol}://${host}${displayPort}${baseHref()}`;
    } else {
      base = baseHref();
    }

    helper.returnWebhookUrl = function (token) {
      return `${base}${API_ENDPOINT_WEBHOOKS}/${token}`;
    };

    helper.returnStackWebhookUrl = function (token) {
      return `${base}${API_ENDPOINT_STACKS}/webhooks/${token}`;
    };

    return helper;
  },
]);
