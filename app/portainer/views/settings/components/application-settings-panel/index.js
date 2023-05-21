import angular from 'angular';

import controller from './application-settings-panel.controller';

angular.module('portainer.app').component('applicationSettingsPanel', {
  templateUrl: './application-settings-panel.html',
  controller,
  bindings: {
    settings: '<',
    onSubmit: '<',
  },
});
