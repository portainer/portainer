import angular from 'angular';

import { ContainersDatatableAngular } from './components/ContainersDatatable/ContainersDatatableContainer';

export default angular
  .module('portainer.docker.containers', [])
  .component('containersDatatable', ContainersDatatableAngular).name;
