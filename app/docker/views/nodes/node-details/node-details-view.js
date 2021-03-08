angular.module('portainer.docker').component('nodeDetailsView', {
  templateUrl: './node-details-view.html',
  controller: 'NodeDetailsViewController',
  bindings: {
    endpoint: '<',
  },
});
