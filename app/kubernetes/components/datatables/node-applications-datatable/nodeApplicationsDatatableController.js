import { KubernetesApplicationDeploymentTypes } from 'Kubernetes/models/application/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application';
import KubernetesNamespaceHelper from 'Kubernetes/helpers/namespaceHelper';

angular.module('portainer.docker').controller('KubernetesNodeApplicationsDatatableController', [
  '$scope',
  '$controller',
  'DatatableService',
  function ($scope, $controller, DatatableService) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

    this.isSystemNamespace = function (item) {
      return KubernetesNamespaceHelper.isSystemNamespace(item.ResourcePool);
    };

    this.isExternalApplication = function (item) {
      return KubernetesApplicationHelper.isExternalApplication(item);
    };

    this.$onInit = function () {
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
  },
]);
