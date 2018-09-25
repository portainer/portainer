angular.module('portainer.app').controller('EndpointListController', [
  '$filter',
  function EndpointListController($filter) {
    var ctrl = this;
    ctrl.state = {
      textFilter: '',
      filteredEndpoints: []
    };

    ctrl.$onChanges = $onChanges;
    ctrl.onFilterChanged = onFilterChanged;

    function $onChanges(changesObj) {
      handleEndpointsChange(changesObj.endpoints);
    }

    function handleEndpointsChange(endpoints) {
      if (!endpoints) {
        return;
      }
      if (!endpoints.currentValue) {
        return;
      }

      onFilterChanged();
    }

    function onFilterChanged() {
      var filterValue = ctrl.state.textFilter;
      ctrl.state.filteredEndpoints = filterEndpoints(
        ctrl.endpoints,
        filterValue
      );
    }

    function filterEndpoints(endpoints, filterValue) {
      if (!endpoints || !endpoints.length || !filterValue) {
        return endpoints;
      }
      var keywords = filterValue.split(' ');
      return _.filter(endpoints, function(endpoint) {
        return _.every(keywords, function(keyword) {
          return (
            _.includes(endpoint.Name, keyword) ||
            _.includes(endpoint.GroupName, keyword) ||
            _.some(endpoint.Tags, function(tag) {
              return _.includes(tag, keyword);
            })
          );
        });
      });
    }
  }
]);
