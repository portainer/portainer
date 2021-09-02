import angular from 'angular';
import controller from './applications-datatable-details.controller';

angular.module('portainer.kubernetes').component('kubernetesApplicationsDatatableDetails', {
  templateUrl: './applications-datatable-details.html',
  controller,
  bindings: {
    configurations: '<',
  },
});
