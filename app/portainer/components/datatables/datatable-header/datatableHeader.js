import angular from 'angular';

angular.module('portainer.app').component('datatableHeader', {
  templateUrl: './datatableHeader.html',
  bindings: {
    label: "@",
    sortKey: '@',
    orderBy: '<',
    reverseOrder: '<',
    changeOrderBy: '<'
  }
});
