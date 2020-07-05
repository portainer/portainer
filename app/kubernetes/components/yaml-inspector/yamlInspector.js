angular.module('portainer.kubernetes').component('kubernetesYamlInspector', {
  templateUrl: './yamlInspector.html',
  controller: 'KubernetesYamlInspectorController',
  bindings: {
    key: '@',
    data: '<',
  },
});
