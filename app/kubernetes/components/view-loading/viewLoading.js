angular.module('portainer.kubernetes').component('kubernetesViewLoading', {
  templateUrl: './viewLoading.html',
  bindings: {
    viewReady: '<',
  },
});
