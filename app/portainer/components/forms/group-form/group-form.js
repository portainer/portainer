angular.module('portainer.app').component('groupForm', {
  templateUrl: './groupForm.html',
  controller: function() {
    var ctrl = this;

    this.associateEndpoint = function(endpoint) {
      ctrl.associatedEndpoints.push(endpoint);
      _.remove(ctrl.availableEndpoints, function(n) {
        return n.Id === endpoint.Id;
      });
    };

    this.dissociateEndpoint = function(endpoint) {
      ctrl.availableEndpoints.push(endpoint);
      _.remove(ctrl.associatedEndpoints, function(n) {
        return n.Id === endpoint.Id;
      });
    };

  },
  bindings: {
    model: '=',
    availableEndpoints: '=',
    availableTags: '<',
    associatedEndpoints: '=',
    addLabelAction: '<',
    removeLabelAction: '<',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<'
  }
});
