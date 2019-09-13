angular.module('portainer.kubernetes').component('kubernetesContainerInstanceState', {
  templateUrl: './containerInstanceState.html',
  bindings: {
    state: '<'
  }
});
