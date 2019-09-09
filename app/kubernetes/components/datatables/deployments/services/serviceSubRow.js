angular.module('portainer.kubernetes').component('kubernetesServiceSubRow', {
  templateUrl: './serviceSubRow.html',
  bindings: {
    service: '<',
    textFilter: '='
  }
});
