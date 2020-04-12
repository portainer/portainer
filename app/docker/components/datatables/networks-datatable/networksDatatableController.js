import _ from 'lodash-es';

angular.module('portainer.docker').controller('NetworksDatatableController', [
  '$scope',
  '$controller',
  'NetworkHelper',
  'DatatableService',
  function ($scope, $controller, NetworkHelper, DatatableService) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

    this.disableRemove = function (item) {
      return NetworkHelper.isSystemNetwork(item);
    };

    this.state = Object.assign(this.state, {
      expandedItems: [],
    });

    /**
     * Do not allow system networks to be selected
     */
    this.allowSelection = function (item) {
      return !this.disableRemove(item);
    };

    this.$onInit = function () {
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

    this.expandItem = function (item, expanded) {
      item.Expanded = expanded;
    };

    this.itemCanExpand = function (item) {
      return item.Subs.length > 0;
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
  },
]);
