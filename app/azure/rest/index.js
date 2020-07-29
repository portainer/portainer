import angular from 'angular';

import { ContainerGroup } from './container-group';
import { Provider } from './provider';
import { ResourceGroup } from './resource-group';
import { Subscription } from './subscription';

export default angular
  .module('portainer.azure.rest', [])
  .factory('ContainerGroup', ContainerGroup)
  .factory('Provider', Provider)
  .factory('ResourceGroup', ResourceGroup)
  .factory('Subscription', Subscription).name;
