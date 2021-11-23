import _ from 'lodash-es';

angular.module('portainer.docker').controller('ContainersDatatableController', [
  '$scope',
  '$controller',
  'DatatableService',
  function ($scope, $controller, DatatableService) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

    var ctrl = this;

    this.state = Object.assign(this.state, {
      noStoppedItemsSelected: true,
      noRunningItemsSelected: true,
      noPausedItemsSelected: true,
    });

    this.settings = Object.assign(this.settings, {
      truncateContainerName: true,
      containerNameTruncateSize: 32,
      showQuickActionStats: true,
      showQuickActionLogs: true,
      showQuickActionExec: true,
      showQuickActionInspect: true,
      showQuickActionAttach: false,
    });

    this.filters = {
      state: {
        open: false,
        enabled: false,
        values: [],
      },
    };

    this.columnVisibility = {
      columns: {
        state: {
          label: 'State',
          display: true,
        },
        actions: {
          label: 'Quick Actions',
          display: true,
        },
        stack: {
          label: 'Stack',
          display: true,
        },
        image: {
          label: 'Image',
          display: true,
        },
        created: {
          label: 'Created',
          display: true,
        },
        ip: {
          label: 'IP Address',
          display: true,
        },
        host: {
          label: 'Host',
          display: true,
        },
        ports: {
          label: 'Published Ports',
          display: true,
        },
        ownership: {
          label: 'Ownership',
          display: true,
        },
      },
    };

    this.onColumnVisibilityChange = onColumnVisibilityChange.bind(this);
    function onColumnVisibilityChange(columns) {
      this.columnVisibility.columns = columns;
      DatatableService.setColumnVisibilitySettings(this.tableKey, this.columnVisibility);
    }

    this.onSelectionChanged = function () {
      this.updateSelectionState();
    };

    this.updateSelectionState = function () {
      this.state.noStoppedItemsSelected = true;
      this.state.noRunningItemsSelected = true;
      this.state.noPausedItemsSelected = true;

      for (var i = 0; i < this.dataset.length; i++) {
        var item = this.dataset[i];
        if (item.Checked) {
          this.updateSelectionStateBasedOnItemStatus(item);
        }
      }
    };

    this.updateSelectionStateBasedOnItemStatus = function (item) {
      if (item.Status === 'paused') {
        this.state.noPausedItemsSelected = false;
      } else if (['stopped', 'created'].indexOf(item.Status) !== -1) {
        this.state.noStoppedItemsSelected = false;
      } else if (['running', 'healthy', 'unhealthy', 'starting'].indexOf(item.Status) !== -1) {
        this.state.noRunningItemsSelected = false;
      }
    };

    this.applyFilters = function (value) {
      var container = value;
      var filters = ctrl.filters;
      for (var i = 0; i < filters.state.values.length; i++) {
        var filter = filters.state.values[i];
        if (container.Status === filter.label && filter.display) {
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

    this.onSettingsContainerNameTruncateChange = function () {
      if (this.settings.truncateContainerName) {
        this.settings.containerNameTruncateSize = 32;
      } else {
        this.settings.containerNameTruncateSize = 256;
      }
      DatatableService.setDataTableSettings(this.tableKey, this.settings);
    };

    this.onSettingsQuickActionChange = function () {
      DatatableService.setDataTableSettings(this.tableKey, this.settings);
    };

    this.prepareTableFromDataset = function () {
      var availableStateFilters = [];
      for (var i = 0; i < this.dataset.length; i++) {
        var item = this.dataset[i];
        availableStateFilters.push({ label: item.Status, display: true });
      }
      this.filters.state.values = _.uniqBy(availableStateFilters, 'label');
    };

    this.updateStoredFilters = function (storedFilters) {
      var datasetFilters = this.filters.state.values;

      for (var i = 0; i < datasetFilters.length; i++) {
        var filter = datasetFilters[i];
        var existingFilter = _.find(storedFilters, ['label', filter.label]);
        if (existingFilter && !existingFilter.display) {
          filter.display = existingFilter.display;
          this.filters.state.enabled = true;
        }
      }
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
        this.filters.state.open = false;
        this.updateStoredFilters(storedFilters.state.values);
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
  },
]);
