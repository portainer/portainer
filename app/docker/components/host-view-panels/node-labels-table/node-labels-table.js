import angular from 'angular';

angular.module('portainer.docker').component('nodeLabelsTable', {
  templateUrl:
    'app/docker/components/host-view-panels/node-labels-table/node-labels-table.html',
  controller: 'NodeLabelsTableController',
  bindings: {
    labels: '<',
    onChangedLabels: '&'
  }
});
