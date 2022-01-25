import angular from 'angular';

import controller from './addProfileController';

angular.module('portainer.app').component('addProfileView', {
  templateUrl: './addProfile.html',
  controller,
});
