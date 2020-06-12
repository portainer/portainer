angular.module('portainer.kubernetes').component('kubernetesViewHeader', {
  templateUrl: './viewHeader.html',
  transclude: true,
  bindings: {
    viewReady: '<',
    title: '@',
    state: '@',
  },
});
