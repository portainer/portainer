import angular from 'angular';
import controller from './create-user-access-token.controller';

angular.module('portainer.app').component('createUserAccessToken', {
  templateUrl: './create-user-access-token.html',
  controller,
});
