import angular from 'angular';

class KubernetesYamlInspectorController {
  /* @ngInject */

  constructor(clipboard) {
    this.clipboard = clipboard;
    this.expanded = false;
  }

  copyYAML() {
    this.clipboard.copyText(this.data);
    $('#copyNotificationYAML').show().fadeOut(2500);
  }

  toggleYAMLInspectorExpansion() {
    let selector = 'kubernetes-yaml-inspector code-editor > div.CodeMirror';
    let height = this.expanded ? '500px' : '80vh';
    $(selector).css({ height: height });
    this.expanded = !this.expanded;
  }
}

export default KubernetesYamlInspectorController;
angular.module('portainer.kubernetes').controller('KubernetesYamlInspectorController', KubernetesYamlInspectorController);
