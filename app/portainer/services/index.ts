import angular from 'angular';

import { Notifications } from './notifications';
import { ModalServiceAngular } from './modal.service';

export default angular
  .module('portainer.app.services', [])
  .factory('Notifications', Notifications)
  .factory('ModalService', ModalServiceAngular).name;
