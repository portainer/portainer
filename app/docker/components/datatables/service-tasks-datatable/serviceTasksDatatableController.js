import _ from 'lodash-es';

angular.module('portainer.docker').controller('ServiceTasksDatatableController', [
  '$scope',
  '$controller',
  'DatatableService',
  function ($scope, $controller, DatatableService) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

    var ctrl = this;

    this.state = Object.assign(this.state, {
      showQuickActionStats: true,
      showQuickActionLogs: true,
      showQuickActionConsole: true,
      showQuickActionInspect: true,
      showQuickActionExec: true,
      showQuickActionAttach: false,
    });

    this.filters = {
      state: {
        open: false,
        enabled: false,
        values: [],
      },
    };

    this.applyFilters = function (item) {
      var filters = ctrl.filters;
      for (var i = 0; i < filters.state.values.length; i++) {
        var filter = filters.state.values[i];
        if (item.Status.State === filter.label && filter.display) {
          return true;
        }
      }
      return false;
    };

    this.onStateFilterChange = function () {
      var filters = this.filters.state.values;
      var filtered = false;
      for (var i = 0; i < filters.length; i++) {
        var filter = filters[i];
        if (!filter.display) {
          filtered = true;
        }
      }
      this.filters.state.enabled = filtered;
    };

    this.prepareTableFromDataset = function () {
      var availableStateFilters = [];
      for (var i = 0; i < this.dataset.length; i++) {
        var item = this.dataset[i];
        availableStateFilters.push({ label: item.Status.State, display: true });
      }
      this.filters.state.values = _.uniqBy(availableStateFilters, 'label');
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
  },
]);
