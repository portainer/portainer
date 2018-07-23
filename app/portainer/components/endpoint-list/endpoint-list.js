angular.module('portainer.app').component('endpointList', {
  templateUrl: 'app/portainer/components/endpoint-list/endpointList.html',
  controller: function() {
    var ctrl = this;

    this.state = {
      textFilter: ''
    };
  },
  bindings: {
    titleText: '@',
    titleIcon: '@',
    endpoints: '<',
    dashboardAction: '<'
  }
});
