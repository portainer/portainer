import { KubernetesApplicationDeploymentTypes, KubernetesApplicationTypes } from 'Kubernetes/models/application/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application';
import KubernetesNamespaceHelper from 'Kubernetes/helpers/namespaceHelper';
import { KubernetesConfigurationTypes } from 'Kubernetes/models/configuration/models';

angular.module('portainer.docker').controller('KubernetesApplicationsDatatableController', [
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

    this.state = Object.assign(this.state, {
      expandAll: false,
      expandedItems: [],
    });

    this.expandAll = function () {
      this.state.expandAll = !this.state.expandAll;
      this.state.filteredDataSet.forEach((item) => this.expandItem(item, this.state.expandAll));
    };

    this.expandItem = function (item, expanded) {
      item.Expanded = expanded;
      if (!item.Expanded) {
        this.state.expandedItems = this.state.expandedItems.filter((id) => id !== item.Id);
      } else if (item.Expanded && !this.state.expandedItems.includes(item.Id)) {
        this.state.expandedItems = [...this.state.expandedItems, item.Id];
      }
      DatatableService.setDataTableExpandedItems(this.tableKey, this.state.expandedItems);
    };

    function expandPreviouslyExpandedItem(item, storedExpandedItems) {
      const expandedItem = storedExpandedItems.some((storedId) => storedId === item.Id);
      if (expandedItem) {
        ctrl.expandItem(item, true);
      }
    }

    this.expandItems = function (storedExpandedItems) {
      let expandedItemCount = 0;
      this.state.expandedItems = storedExpandedItems;

      for (let i = 0; i < this.dataset.length; i++) {
        const item = this.dataset[i];
        expandPreviouslyExpandedItem(item, storedExpandedItems);
        if (item.Expanded) {
          ++expandedItemCount;
        }
      }

      if (expandedItemCount === this.dataset.length) {
        this.state.expandAll = true;
      }
    };

    this.onDataRefresh = function () {
      const storedExpandedItems = DatatableService.getDataTableExpandedItems(this.tableKey);
      if (storedExpandedItems !== null) {
        this.expandItems(storedExpandedItems);
      }
    };

    this.onSettingsShowSystemChange = function () {
      DatatableService.setDataTableSettings(this.tableKey, this.settings);
    };

    this.isExternalApplication = function (item) {
      return KubernetesApplicationHelper.isExternalApplication(item);
    };

    this.isSystemNamespace = function (item) {
      // if all charts in a helm app/release are in the system namespace
      if (item.KubernetesApplications && item.KubernetesApplications.length > 0) {
        return item.KubernetesApplications.some((app) => KubernetesNamespaceHelper.isSystemNamespace(app.ResourcePool));
      }
      return KubernetesNamespaceHelper.isSystemNamespace(item.ResourcePool);
    };

    this.isDisplayed = function (item) {
      return !ctrl.isSystemNamespace(item) || ctrl.settings.showSystem;
    };

    this.getPublishUrl = function (item) {
      // Map all ingress rules in published ports to their respective URLs
      const publishUrls = item.PublishedPorts.flatMap((pp) => pp.IngressRules)
        .filter(({ Host, IP }) => Host || IP)
        .map(({ Host, IP, Path }) => `http://${Host || IP}${Path}`);

      // Return the first URL
      return publishUrls.length > 0 ? publishUrls[0] : '';
    };

    this.hasConfigurationSecrets = function (item) {
      return item.Configurations && item.Configurations.some((config) => config.Data && config.Type === KubernetesConfigurationTypes.SECRET);
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

      var storedExpandedItems = DatatableService.getDataTableExpandedItems(this.tableKey);
      if (storedExpandedItems !== null) {
        this.expandItems(storedExpandedItems);
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
