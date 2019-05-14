angular.module('portainer.docker')
.controller('VolumesDatatableController', ['$scope', '$controller', 'DatatableService',
function ($scope, $controller, DatatableService) {

  angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

  var ctrl = this;

  this.filters = {
    state: {
      open: false,
      enabled: false,
      showUsedVolumes: true,
      showUnusedVolumes: true
    }
  };

  this.applyFilters = function(value) {
    var volume = value;
    var filters = ctrl.filters;
    if ((volume.dangling && filters.state.showUnusedVolumes)
      || (!volume.dangling && filters.state.showUsedVolumes)) {
      return true;
    }
    return false;
  };

  this.onstateFilterChange = function() {
    var filters = this.filters.state;
    var filtered = false;
    if (!filters.showUsedVolumes || !filters.showUnusedVolumes) {
      filtered = true;
    }
    this.filters.state.enabled = filtered;
    DatatableService.setDataTableFilters(this.tableKey, this.filters);
  };
}]);
