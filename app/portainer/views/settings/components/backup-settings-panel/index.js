import angular from 'angular';

import controller from './backup-settings-panel.controller';

angular.module('portainer.app').component('backupSettingsPanel', {
  templateUrl: './backup-settings-panel.html',
  controller,
  bindings: {
    settings: '<',
    onSubmit: '<',
  },
});
