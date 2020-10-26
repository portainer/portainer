import { KubernetesApplicationDeploymentTypes, KubernetesApplicationTypes } from 'Kubernetes/models/application/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application';

angular.module('portainer.docker').controller('KubernetesApplicationsDatatableController', [
  '$scope',
  '$controller',
  'KubernetesNamespaceHelper',
  'DatatableService',
  'Authentication',
  function ($scope, $controller, KubernetesNamespaceHelper, DatatableService, Authentication) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

    var ctrl = this;

    this.settings = Object.assign(this.settings, {
      showSystem: false,
    });

    this.onSettingsShowSystemChange = function () {
      DatatableService.setDataTableSettings(this.tableKey, this.settings);
    };

    this.isExternalApplication = function (item) {
      return KubernetesApplicationHelper.isExternalApplication(item);
    };

    this.isSystemNamespace = function (item) {
      return KubernetesNamespaceHelper.isSystemNamespace(item.ResourcePool);
    };

    this.isDisplayed = function (item) {
      return !ctrl.isSystemNamespace(item) || ctrl.settings.showSystem;
    };

    /**
     * Do not allow applications in system namespaces to be selected
     */
    this.allowSelection = function (item) {
      return !this.isSystemNamespace(item);
    };

    this.$onInit = function () {
      this.isAdmin = Authentication.isAdmin();
      this.KubernetesApplicationDeploymentTypes = KubernetesApplicationDeploymentTypes;
      this.KubernetesApplicationTypes = KubernetesApplicationTypes;
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
