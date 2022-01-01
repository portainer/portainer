import _ from 'lodash-es';

angular.module('portainer.docker').controller('ServicesDatatableController', [
  '$scope',
  '$controller',
  'DatatableService',
  function ($scope, $controller, DatatableService) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

    var ctrl = this;

    this.state = Object.assign(this.state, {
      expandAll: false,
      expandedItems: [],
    });

    this.columnVisibility = {
      columns: {
        image: {
          label: 'Image',
          display: true,
        },
        ownership: {
          label: 'OwnerShip',
          display: true,
        },
        ports: {
          label: 'Published Ports',
          display: true,
        },
        updated: {
          label: 'Last Update',
          display: true,
        },
      },
    };

    this.onColumnVisibilityChange = onColumnVisibilityChange.bind(this);
    function onColumnVisibilityChange(columns) {
      this.columnVisibility.columns = columns;
      DatatableService.setColumnVisibilitySettings(this.tableKey, this.columnVisibility);
    }

    this.expandAll = function () {
      this.state.expandAll = !this.state.expandAll;
      for (var i = 0; i < this.state.filteredDataSet.length; i++) {
        var item = this.state.filteredDataSet[i];
        this.expandItem(item, this.state.expandAll);
      }
    };

    this.expandItem = function (item, expanded) {
      item.Expanded = expanded;
      if (item.Expanded) {
        if (this.state.expandedItems.indexOf(item.Id) === -1) {
          this.state.expandedItems.push(item.Id);
        }
      } else {
        var index = this.state.expandedItems.indexOf(item.Id);
        if (index > -1) {
          this.state.expandedItems.splice(index, 1);
        }
      }
      DatatableService.setDataTableExpandedItems(this.tableKey, this.state.expandedItems);
    };

    function expandPreviouslyExpandedItem(item, storedExpandedItems) {
      var expandedItem = _.find(storedExpandedItems, function (storedId) {
        return item.Id === storedId;
      });

      if (expandedItem) {
        ctrl.expandItem(item, true);
      }
    }

    this.expandItems = function (storedExpandedItems) {
      var expandedItemCount = 0;
      this.state.expandedItems = storedExpandedItems;

      for (var i = 0; i < this.dataset.length; i++) {
        var item = this.dataset[i];
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
      var storedExpandedItems = DatatableService.getDataTableExpandedItems(this.tableKey);
      if (storedExpandedItems !== null) {
        this.expandItems(storedExpandedItems);
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
      var storedColumnVisibility = DatatableService.getColumnVisibilitySettings(this.tableKey);
      if (storedColumnVisibility !== null) {
        this.columnVisibility = storedColumnVisibility;
      }
    };
  },
]);
