angular.module('portainer.app').controller('EndpointItemController', [
  function EndpointItemController() {
    var ctrl = this;

    ctrl.editEndpoint = editEndpoint;

    function editEndpoint(event) {
      event.stopPropagation();
      ctrl.onEdit(ctrl.model.Id);
    }
  }
]);
