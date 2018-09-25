angular.module('portainer.app').component('endpointItem', {
  templateUrl: 'app/portainer/components/endpoint-list/endpoint-item/endpointItem.html',
  bindings: {
    model: '<',
    onSelect: '<',
    onEdit: '<'
  },
  controller: 'EndpointItemController'
});
