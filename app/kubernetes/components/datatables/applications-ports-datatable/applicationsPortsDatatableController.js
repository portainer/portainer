import _ from 'lodash-es';
import { KubernetesApplicationDeploymentTypes } from 'Kubernetes/models/application/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application';
import KubernetesNamespaceHelper from 'Kubernetes/helpers/namespaceHelper';
import { KubernetesServiceTypes } from 'Kubernetes/models/service/models';

angular.module('portainer.docker').controller('KubernetesApplicationsPortsDatatableController', [
  '$scope',
  '$controller',
  'DatatableService',
  'Authentication',
  function ($scope, $controller, DatatableService, Authentication) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));
    this.state = Object.assign(this.state, {
      expandedItems: [],
      expandAll: false,
    });

    var ctrl = this;
    this.KubernetesServiceTypes = KubernetesServiceTypes;

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
      return item.Ports.length > 1 || item.Ports[0].IngressRules.length > 1;
    };

    this.buildIngressRuleURL = function (rule) {
      const hostname = rule.Host ? rule.Host : rule.IP;
      return 'http://' + hostname + rule.Path;
    };

    this.portHasIngressRules = function (port) {
      return port.IngressRules.length > 0;
    };

    this.ruleCanBeDisplayed = function (rule) {
      return !rule.Host && !rule.IP ? false : true;
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

      var storedSettings = DatatableService.getDataTableSettings(this.tableKey);
      if (storedSettings !== null) {
        this.settings = storedSettings;
        this.settings.open = false;
      }
      this.onSettingsRepeaterChange();
    };
  },
]);
