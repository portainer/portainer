angular.module('portainer.app')
.controller('SidebarEndpointSelectorController', function () {
  var ctrl = this;

  this.state = {
    show: false,
    selectedGroup: null,
    selectedEndpoint: null
  };

  this.selectGroup = function() {
    this.availableEndpoints = this.endpoints.filter(function f(endpoint) {
      return endpoint.GroupId === ctrl.state.selectedGroup.Id;
    });
  };

  this.$onInit = function() {
    this.availableGroups = filterEmptyGroups(this.groups, this.endpoints);
    this.availableEndpoints = this.endpoints;
  };

  function filterEmptyGroups(groups, endpoints) {
    return groups.filter(function f(group) {
      for (var i = 0; i < endpoints.length; i++) {

        var endpoint = endpoints[i];
        if (endpoint.GroupId === group.Id) {
          return true;
        }
      }
      return false;
    });
  }
});
