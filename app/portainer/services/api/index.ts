import angular from 'angular';

import { UserService } from './userService';

export const apiServicesModule = angular
  .module('portainer.app.services.api', [])
  .factory('UserService', UserService).name;
