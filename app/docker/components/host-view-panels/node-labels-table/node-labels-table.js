angular.module('portainer.docker').component('nodeLabelsTable', {
  templateUrl: './node-labels-table.html',
  controller: 'NodeLabelsTableController',
  bindings: {
    labels: '<',
    onChangedLabels: '&',
  },
});
