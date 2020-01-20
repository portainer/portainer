angular.module('portainer.docker')
  .controller('KubernetesResourcePoolsDatatableController', ['$scope', '$controller', 'KubernetesNamespaceHelper', 'DatatableService',
    function ($scope, $controller, KubernetesNamespaceHelper, DatatableService) {

      angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

      this.disableRemove = function(item) {
        return KubernetesNamespaceHelper.isSystemNamespace(item.Namespace.Name);
      };

      this.isSystemNamespace = function(item) {
        return KubernetesNamespaceHelper.isSystemNamespace(item.Namespace.Name);
      };

      /**
       * Do not allow system namespaces to be selected
       */
      this.allowSelection = function(item) {
        return !this.disableRemove(item);
      };

      this.$onInit = function() {
        this.setDefaults();
        this.prepareTableFromDataset();
    
        this.state.orderBy = this.orderBy;
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
    
        var storedSettings = DatatableService.getDataTableSettings(this.tableKey);
        if (storedSettings !== null) {
          this.settings = storedSettings;
          this.settings.open = false;
        }
        this.onSettingsRepeaterChange();
      };
  }
]);