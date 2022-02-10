import angular from 'angular';

import { apiServicesModule } from './api';
import { Notifications } from './notifications';
import { ModalServiceAngular } from './modal.service';
import { HttpRequestHelperAngular } from './http-request.helper';

export default angular
  .module('portainer.app.services', [apiServicesModule])
  .factory('Notifications', Notifications)
  .factory('ModalService', ModalServiceAngular)
  .factory('HttpRequestHelper', HttpRequestHelperAngular).name;
