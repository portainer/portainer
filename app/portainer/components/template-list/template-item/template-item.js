angular.module('portainer.app').component('templateItem', {
  templateUrl: 'app/portainer/components/template-list/template-item/templateItem.html',
  bindings: {
    model: '=',
    onSelect: '<',
    onDelete: '<',
    showUpdateAction: '<',
    showDeleteAction: '<'
  }
});
