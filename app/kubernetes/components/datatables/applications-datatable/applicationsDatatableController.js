import {KubernetesApplicationDeploymentTypes} from 'Kubernetes/models/application';

angular.module('portainer.docker')
  .controller('KubernetesApplicationsDatatableController', ['$scope', '$controller', 'KubernetesNamespaceHelper', 'DatatableService',
    function ($scope, $controller, KubernetesNamespaceHelper, DatatableService) {

      angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

      this.disableRemove = function(item) {
        return KubernetesNamespaceHelper.isAppSystemNamespace(item.ResourcePool);
      };

      this.isPartOfSystemNamespace = function(item) {
        return KubernetesNamespaceHelper.isSystemNamespace(item.ResourcePool);
      };

      /**
       * Do not allow applications in system namespaces to be selected
       */
      this.allowSelection = function(item) {
        return !this.disableRemove(item);
      }

      this.$onInit = function() {
        this.KubernetesApplicationDeploymentTypes = KubernetesApplicationDeploymentTypes;
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