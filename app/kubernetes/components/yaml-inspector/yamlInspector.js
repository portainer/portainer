angular.module('portainer.kubernetes').component('kubernetesYamlInspector', {
  templateUrl: './yamlInspector.html',
  controller: 'KubernetesYamlInspectorController',
  controllerAs: 'ctrl',
  bindings: {
    key: '@',
    data: '<',
    onEditorChange: '<',
    resourceType: '@',
    updateVisible: '<',
    updateDisabled: '<',
    updateAction: '<'
  },
});
