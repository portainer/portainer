import angular from 'angular';

import { UserService } from './userService';
import { EndpointService } from './endpoint.service';

export const apiServicesModule = angular
  .module('portainer.app.services.api', [])
  .factory('EndpointService', EndpointService)
  .factory('UserService', UserService).name;
