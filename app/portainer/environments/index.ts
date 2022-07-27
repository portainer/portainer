import angular from 'angular';

import { azureEndpointConfig } from './azure-endpoint-config/azure-endpoint-config';

export default angular
  .module('portainer.environments', [])
  .component('azureEndpointConfig', azureEndpointConfig).name;
