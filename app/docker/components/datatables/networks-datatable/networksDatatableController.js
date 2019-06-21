angular.module('portainer.docker')
  .controller('NetworksDatatableController', ['$scope', '$controller', 'PREDEFINED_NETWORKS', 'DatatableService',
    function ($scope, $controller, PREDEFINED_NETWORKS, DatatableService) {

      angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

      this.disableRemove = function(item) {
        return PREDEFINED_NETWORKS.includes(item.Name);
      };

      /**
       * Do not allow PREDEFINED_NETWORKS to be selected
       */
      this.allowSelection = function(item) {
        return !this.disableRemove(item);
      }

      this.$onInit = function() {
        this.setDefaults();
        this.prepareTableFromDataset();

        var storedOrder = DatatableService.getDataTableOrder(this.tableKey);
        if (storedOrder !== null) {
          this.state.reverseOrder = storedOrder.reverse;
          this.state.orderBy = storedOrder.orderBy;
        }

        var textFilter = DatatableService.getDataTableTextFilters(this.tableKey);
        if (textFilter !== null) {
          this.state.textFilter = textFilter;
          this.onTextFilterChange();
        }

        var storedFilters = DatatableService.getDataTableFilters(this.tableKey);
        if (storedFilters !== null) {
          this.filters = storedFilters;
        }
        if (this.filters && this.filters.state) {
          this.filters.state.open = false;
        }
      };
  }
]);