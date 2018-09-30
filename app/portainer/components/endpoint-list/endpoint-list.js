angular.module('portainer.app').component('endpointList', {
  templateUrl: 'app/portainer/components/endpoint-list/endpointList.html',
  controller: function() {
    this.state = {
      textFilter: ''
    };
  },
  bindings: {
    titleText: '@',
    titleIcon: '@',
    endpoints: '<',
    dashboardAction: '<',
    snapshotAction: '<',
    showSnapshotAction: '<',
    editAction: '<',
    isAdmin:'<'
  }
});
