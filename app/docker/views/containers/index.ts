import angular from 'angular';

import { createContainerModule } from './create';

export const containersModule = angular.module('portainer.docker.containers', [
  createContainerModule,
]).name;
