import angular from 'angular';

angular.module('portainer.app').component('templateItem', {
  templateUrl: './templateItem.html',
  bindings: {
    model: '=',
    onSelect: '<',
    onDelete: '<',
    showUpdateAction: '<',
    showDeleteAction: '<'
  }
});
