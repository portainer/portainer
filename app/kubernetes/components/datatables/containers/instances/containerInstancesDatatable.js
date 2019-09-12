angular.module('portainer.kubernetes').component('kubernetesContainerInstancesDatatable', {
  templateUrl: './containerInstancesDatatable.html',
  bindings: {
    titleText: '@',
    titleIcon: '@',
    dataset: '<',
    loading: '<'
  }
});
