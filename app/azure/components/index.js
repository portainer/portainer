import angular from 'angular';

import { azureEndpointConfig } from './azure-endpoint-config';
import { azureSidebar } from './azure-sidebar';

export default angular.module('portainer.azure.components', []).component('azureEndpointConfig', azureEndpointConfig).component('azureSidebar', azureSidebar).name;
