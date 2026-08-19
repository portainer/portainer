import angular from 'angular';
import controller from './oauth-settings.controller';

angular.module('portainer.oauth').component('oauthSettings', {
  templateUrl: './oauth-settings.html',
  bindings: {
    settings: '=',
    teams: '<',
    onSaveSettings: '<',
    saveButtonState: '<',
  },
  controller,
});
