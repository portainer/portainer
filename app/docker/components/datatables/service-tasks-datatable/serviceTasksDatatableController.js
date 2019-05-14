import _ from 'lodash-es';

angular.module('portainer.docker')
  .controller('ServiceTasksDatatableController', ['$scope', '$controller', 'DatatableService',
    function ($scope, $controller, DatatableService) {

      angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

      var ctrl = this;

      this.state = Object.assign(this.state, {
        showQuickActionStats: true,
        showQuickActionLogs: true,
        showQuickActionConsole: true,
        showQuickActionInspect: true,
        showQuickActionAttach: false
      });

      this.filters = {
        state: {
          open: false,
          enabled: false,
          values: []
        }
      };

      this.applyFilters = function(item) {
        var filters = ctrl.filters;
        for (var i = 0; i < filters.state.values.length; i++) {
          var filter = filters.state.values[i];
          if (item.Status.State === filter.label && filter.display) {
            return true;
          }
        }
        return false;
      };

      this.onStateFilterChange = function() {
        var filters = this.filters.state.values;
        var filtered = false;
        for (var i = 0; i < filters.length; i++) {
          var filter = filters[i];
          if (!filter.display) {
            filtered = true;
          }
        }
        this.filters.state.enabled = filtered;
      };

      this.changeOrderBy = function(orderField) {
        this.state.reverseOrder = this.state.orderBy === orderField ? !this.state.reverseOrder : false;
        this.state.orderBy = orderField;
        DatatableService.setDataTableOrder(this.tableKey, orderField, this.state.reverseOrder);
      };

      this.prepareTableFromDataset = function() {
        var availableStateFilters = [];
        for (var i = 0; i < this.dataset.length; i++) {
          var item = this.dataset[i];
          availableStateFilters.push({ label: item.Status.State, display: true });
        }
        this.filters.state.values = _.uniqBy(availableStateFilters, 'label');
      };
    }
]);
