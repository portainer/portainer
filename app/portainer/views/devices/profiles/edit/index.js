import angular from 'angular';

import controller from './editProfileController';

angular.module('portainer.app').component('editProfileView', {
  templateUrl: './editProfile.html',
  controller,
});
