import angular from 'angular';

import { Notifications } from './notifications';

export default angular
  .module('portainer.app.services', [])
  .factory('Notifications', Notifications).name;
