import angular from 'angular';

import { WebhookHelperFactory } from './webhookHelper';

export const helpersModule = angular
  .module('portainer.app.helpers', [])
  .factory('WebhookHelper', WebhookHelperFactory).name;
