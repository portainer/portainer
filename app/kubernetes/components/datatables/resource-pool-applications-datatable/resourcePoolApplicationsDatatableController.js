import KubernetesApplicationHelper from 'Kubernetes/helpers/application';
import { getDeploymentOptions } from '@/react/portainer/environments/environment.service';

angular.module('portainer.docker').controller('KubernetesResourcePoolApplicationsDatatableController', [
  '$scope',
  '$controller',
  '$async',
  'DatatableService',
  function ($scope, $controller, $async, DatatableService) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

    this.isExternalApplication = function (item) {
      return KubernetesApplicationHelper.isExternalApplication(item);
    };

    this.$onInit = function () {
      return $async(async () => {
        this.setDefaults();
        this.prepareTableFromDataset();

        this.deploymentOptions = await getDeploymentOptions();

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
      });
    };
  },
]);
