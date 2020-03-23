angular.module('portainer.docker')
  .controller('KubernetesConfigurationsDatatableController', ['$scope', '$controller', 'KubernetesNamespaceHelper', 'DatatableService',
    function ($scope, $controller, KubernetesNamespaceHelper, DatatableService) {

      angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

      this.isSystemNamespace = function(item) {
        return KubernetesNamespaceHelper.isSystemNamespace(item.Namespace);
      };

      /**
       * Do not allow configurations in system namespaces to be selected
       */
      this.allowSelection = function(item) {
        return !this.isSystemNamespace(item) && !item.Used;
      }

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