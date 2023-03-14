import _ from 'lodash-es';
import { KubernetesApplicationDeploymentTypes } from 'Kubernetes/models/application/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application';
import KubernetesNamespaceHelper from 'Kubernetes/helpers/namespaceHelper';

angular.module('portainer.kubernetes').controller('KubernetesApplicationsStacksDatatableController', [
  '$scope',
  '$controller',
  'DatatableService',
  'Authentication',
  function ($scope, $controller, DatatableService, Authentication) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));
    this.state = Object.assign(this.state, {
      expandedItems: [],
      expandAll: false,
      namespace: '',
      namespaces: [],
    });

    var ctrl = this;

    this.settings = Object.assign(this.settings, {
      showSystem: false,
    });

    this.onSettingsShowSystemChange = function () {
      this.updateNamespace();
      this.setSystemResources(this.settings.showSystem);
      DatatableService.setDataTableSettings(this.tableKey, this.settings);
    };

    this.isExternalApplication = function (item) {
      return KubernetesApplicationHelper.isExternalApplication(item);
    };

    /**
     * Do not allow applications in system namespaces to be selected
     */
    this.allowSelection = function (item) {
      return !this.isSystemNamespace(item.ResourcePool);
    };

    /**
     * @param {String} namespace Namespace (string name)
     * @returns Boolean
     */
    this.isSystemNamespace = function (namespace) {
      return KubernetesNamespaceHelper.isSystemNamespace(namespace);
    };

    this.isDisplayed = function (item) {
      return !ctrl.isSystemNamespace(item.ResourcePool) || ctrl.settings.showSystem;
    };

    this.expandItem = function (item, expanded) {
      if (!this.itemCanExpand(item)) {
        return;
      }

      item.Expanded = expanded;
      if (!expanded) {
        item.Highlighted = false;
      }
    };

    this.itemCanExpand = function (item) {
      return item.Applications.length > 0;
    };

    this.hasExpandableItems = function () {
      return _.filter(this.state.filteredDataSet, (item) => this.itemCanExpand(item)).length;
    };

    this.expandAll = function () {
      this.state.expandAll = !this.state.expandAll;
      _.forEach(this.state.filteredDataSet, (item) => {
        if (this.itemCanExpand(item)) {
          this.expandItem(item, this.state.expandAll);
        }
      });
    };

    this.onChangeNamespace = function () {
      this.onChangeNamespaceDropdown(this.state.namespace);
    };

    this.updateNamespace = function () {
      if (this.namespaces) {
        const namespaces = [{ Name: 'All namespaces', Value: '', IsSystem: false }];
        this.namespaces.find((ns) => {
          if (!this.settings.showSystem && ns.IsSystem) {
            return false;
          }
          namespaces.push({ Name: ns.Name, Value: ns.Name, IsSystem: ns.IsSystem });
        });
        this.state.namespaces = namespaces;

        if (this.state.namespace && !this.state.namespaces.find((ns) => ns.Name === this.state.namespace)) {
          if (this.state.namespaces.length > 1) {
            let defaultNS = this.state.namespaces.find((ns) => ns.Name === 'default');
            defaultNS = defaultNS || this.state.namespaces[1];
            this.state.namespace = defaultNS.Value;
          } else {
            this.state.namespace = this.state.namespaces[0].Value;
          }
          this.onChangeNamespaceDropdown(this.state.namespace);
        }
      }
    };

    this.$onChanges = function () {
      if (typeof this.isSystemResources !== 'undefined') {
        this.settings.showSystem = this.isSystemResources;
        DatatableService.setDataTableSettings(this.settingsKey, this.settings);
      }
      this.state.namespace = this.namespace;
      this.updateNamespace();
      this.prepareTableFromDataset();
    };

    this.$onInit = function () {
      this.isAdmin = Authentication.isAdmin();
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

      var storedSettings = DatatableService.getDataTableSettings(this.settingsKey);
      if (storedSettings !== null) {
        this.settings = storedSettings;
        this.settings.open = false;

        this.setSystemResources && this.setSystemResources(this.settings.showSystem);
      }

      // Set the default selected namespace
      if (!this.state.namespace) {
        this.state.namespace = this.namespace;
      }

      this.updateNamespace();
      this.onSettingsRepeaterChange();
    };
  },
]);
