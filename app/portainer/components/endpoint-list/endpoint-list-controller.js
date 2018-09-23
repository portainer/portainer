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
      var groups = parseGroups(filterValue);
      var tags = parseTags(filterValue);

      if (!tags.length && !groups.length) {
        return $filter('filter')(endpoints, filterValue);
      }

      return endpoints.filter(function(endpoint) {
        return (
          groups.some(function(group) {
            return endpoint.GroupName.includes(group);
          }) &&
          tags.some(function(tag) {
            return endpoint.Tags.some(function(endpointTag) {
              return endpointTag.includes(tag);
            });
          })
        );
      });
    }

    function parseGroups(filterValue) {
      var groupRegex = /group:('((\w+\s*)+)'|(\w+))/g;
      return parseFilter(groupRegex, filterValue);
    }

    function parseTags(filterValue) {
      var tagRegex = /tag:('((.+\s*)+)'|(\w+-?)+)/g;
      return parseFilter(tagRegex, filterValue);
    }

    function parseFilter(regex, filterValue) {
      var match = regex.exec(filterValue);
      var matches = [];
      while (match) {
        matches.push(match[1].replace(/\'/g, ''));
        match = regex.exec(filterValue);
      }
      return matches;
    }
  }
]);
