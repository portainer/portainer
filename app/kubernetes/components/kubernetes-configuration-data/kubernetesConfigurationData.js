angular.module('portainer.kubernetes').component('kubernetesConfigurationData', {
  templateUrl: './kubernetesConfigurationData.html',
  controller: 'KubernetesConfigurationDataController',
  bindings: {
    formValues: '=',
    isValid: '=',
    isCreation: '=',
    isEditorDirty: '=',
  },
});
