import angular from 'angular';

import controller from './kube-settings-panel.controller';

angular.module('portainer.app').component('kubeSettingsPanel', {
  templateUrl: './kube-settings-panel.html',
  controller,
  bindings: {
    settings: '<',
    onSubmit: '<',
  },
});
