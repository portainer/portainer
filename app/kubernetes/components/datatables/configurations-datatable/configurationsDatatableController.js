import KubernetesConfigurationHelper from 'Kubernetes/helpers/configurationHelper';
import KubernetesNamespaceHelper from 'Kubernetes/helpers/namespaceHelper';

angular.module('portainer.docker').controller('KubernetesConfigurationsDatatableController', [
  '$scope',
  '$controller',
  'DatatableService',
  'Authentication',
  function ($scope, $controller, DatatableService, Authentication) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

    const ctrl = this;

    this.settings = Object.assign(this.settings, {
      showSystem: false,
    });

    this.onSettingsShowSystemChange = function () {
      DatatableService.setDataTableSettings(this.tableKey, this.settings);
    };

    this.isSystemNamespace = function (item) {
      return KubernetesNamespaceHelper.isSystemNamespace(item.Namespace);
    };

    this.isSystemToken = function (item) {
      return KubernetesConfigurationHelper.isSystemToken(item);
    };

    this.isSystemConfig = function (item) {
      return ctrl.isSystemNamespace(item) || ctrl.isSystemToken(item) || item.IsRegistrySecret;
    };

    this.isExternalConfiguration = function (item) {
      return KubernetesConfigurationHelper.isExternalConfiguration(item);
    };

    this.isDisplayed = function (item) {
      return !ctrl.isSystemConfig(item) || (ctrl.settings.showSystem && ctrl.isAdmin);
    };

    /**
     * Do not allow configurations in system namespaces to be selected
     */
    this.allowSelection = function (item) {
      return !this.isSystemConfig(item) && !item.Used;
    };

    this.$onInit = function () {
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
    };
  },
]);
