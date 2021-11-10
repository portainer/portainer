import angular from 'angular';

import { Notifications } from './notifications';
import { ModalServiceAngular } from './modal.service';
import { HttpRequestHelperAngular } from './http-request.helper';

export default angular
  .module('portainer.app.services', [])
  .factory('Notifications', Notifications)
  .factory('ModalService', ModalServiceAngular)
  .factory('HttpRequestHelper', HttpRequestHelperAngular).name;
