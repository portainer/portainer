import { FeatureId } from '@/portainer/feature-flags/enums';
import { PortainerEndpointTypes } from 'Portainer/models/endpoint/models';

angular.module('portainer.docker').controller('RegistriesDatatableController', RegistriesDatatableController);

/* @ngInject */
function RegistriesDatatableController($scope, $controller, $state, Authentication, DatatableService) {
  angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

  this.allowSelection = function (item) {
    return item.Id;
  };

  this.enableGoToLink = (item) => {
    return this.isAdmin && item.Id && !this.endpointType;
  };

  this.goToRegistry = function (item) {
    if (
      this.endpointType === PortainerEndpointTypes.KubernetesLocalEnvironment ||
      this.endpointType === PortainerEndpointTypes.AgentOnKubernetesEnvironment ||
      this.endpointType === PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment
    ) {
      $state.go('kubernetes.registries.registry', { id: item.Id });
    } else if (
      this.endpointType === PortainerEndpointTypes.DockerEnvironment ||
      this.endpointType === PortainerEndpointTypes.AgentOnDockerEnvironment ||
      this.endpointType === PortainerEndpointTypes.EdgeAgentOnDockerEnvironment
    ) {
      $state.go('docker.registries.registry', { id: item.Id });
    } else {
      $state.go('portainer.registries.registry', { id: item.Id });
    }
  };

  this.redirectToManageAccess = function (item) {
    if (
      this.endpointType === PortainerEndpointTypes.KubernetesLocalEnvironment ||
      this.endpointType === PortainerEndpointTypes.AgentOnKubernetesEnvironment ||
      this.endpointType === PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment
    ) {
      $state.go('kubernetes.registries.access', { id: item.Id });
    } else {
      $state.go('docker.registries.access', { id: item.Id });
    }
  };

  this.$onInit = function () {
    this.limitedFeature = FeatureId.REGISTRY_MANAGEMENT;
    this.isAdmin = Authentication.isAdmin();
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

    var storedColumnVisibility = DatatableService.getColumnVisibilitySettings(this.tableKey);
    if (storedColumnVisibility !== null) {
      this.columnVisibility = storedColumnVisibility;
    }
  };
}
