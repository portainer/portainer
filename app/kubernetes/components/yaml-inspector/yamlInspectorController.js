import angular from 'angular';

class KubernetesYamlInspectorController {
  /* @ngInject */

  constructor(clipboard) {
    this.clipboard = clipboard;
  }

  copyYAML() {
    this.clipboard.copyText(this.data);
    $('#copyNotificationYAML').show().fadeOut(2500);
  }
}

export default KubernetesYamlInspectorController;
angular.module('portainer.kubernetes').controller('KubernetesYamlInspectorController', KubernetesYamlInspectorController);
