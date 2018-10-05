angular.module('portainer.docker')
.controller('ContainersDatatableController', ['PaginationService', 'DatatableService', 'EndpointProvider',
function (PaginationService, DatatableService, EndpointProvider) {
  var ctrl = this;

  this.state = {
    selectAll: false,
    orderBy: this.orderBy,
    paginatedItemLimit: PaginationService.getPaginationLimit(this.tableKey),
    displayTextFilter: false,
    selectedItemCount: 0,
    selectedItems: [],
    noStoppedItemsSelected: true,
    noRunningItemsSelected: true,
    noPausedItemsSelected: true,
    publicURL: EndpointProvider.endpointPublicURL()
  };

  this.settings = {
    open: false,
    truncateContainerName: true,
    containerNameTruncateSize: 32,
    showQuickActionStats: true,
    showQuickActionLogs: true,
    showQuickActionConsole: true,
    showQuickActionInspect: true
  };

  this.filters = {
    state: {
      open: false,
      enabled: false,
      values: []
    }
  };

  this.columnVisibility = {
    state: {
      open: false
    },
    columns: {
      state: {
        label: 'State',
        display: true
      },
      actions: {
        label: 'Quick Actions',
        display: true
      },
      stack: {
        label: 'Stack',
        display: true
      },
      image: {
        label: 'Image',
        display: true
      },
      created: {
        label: 'Created',
        display: true
      },
      ip: {
        label: 'IP Address',
        display: true
      },
      host: {
        label: 'Host',
        display: true
      },
      ports: {
        label: 'Published Ports',
        display: true
      },
      ownership: {
        label: 'Ownership',
        display: true
      }
    }
  };

  this.onColumnVisibilityChange = function()  {
    DatatableService.setColumnVisibilitySettings(this.tableKey, this.columnVisibility);
  };

  this.changeOrderBy = function(orderField) {
    this.state.reverseOrder = this.state.orderBy === orderField ? !this.state.reverseOrder : false;
    this.state.orderBy = orderField;
    DatatableService.setDataTableOrder(this.tableKey, orderField, this.state.reverseOrder);
  };

  this.ipComparator = function(ip1, ip2) {
    if(this.state.orderBy !== 'IP' || (!ip1 && !ip2)) {
      return ip1 - ip2;
    }
    
    var ip1Parts = ip1.split('.');
    var ip2Parts = ip2.split('.');
   
    var result = 0;
    for(var i = 0; i < ip1Parts.length; i++) {
        var num1 = +ip1Parts[i];
        var num2 = +ip2Parts[i];
      
        if(num1 !== num2) {
          result = num1 - num2;
          break;
        }
    }
    
    return result;
  };

  this.toggleItemSelection = function(item) {
    if (item.Checked) {
      this.state.selectedItemCount++;
      this.state.selectedItems.push(item);
    } else {
      this.state.selectedItems.splice(this.state.selectedItems.indexOf(item), 1);
      this.state.selectedItemCount--;
    }
  };

  this.selectItem = function(item) {
    this.toggleItemSelection(item);
    this.updateSelectionState();
  };

  this.selectAll = function() {
    for (var i = 0; i < this.state.filteredDataSet.length; i++) {
      var item = this.state.filteredDataSet[i];
      if (item.Checked !== this.state.selectAll) {
        item.Checked = this.state.selectAll;
        this.toggleItemSelection(item);
      }
    }
    this.updateSelectionState();
  };

  this.updateSelectionState = function() {
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

  this.updateSelectionStateBasedOnItemStatus = function(item) {
    if (item.Status === 'paused') {
      this.state.noPausedItemsSelected = false;
    } else if (['stopped', 'created'].indexOf(item.Status) !== -1) {
      this.state.noStoppedItemsSelected = false;
    } else if (['running', 'healthy', 'unhealthy', 'starting'].indexOf(item.Status) !== -1) {
      this.state.noRunningItemsSelected = false;
    }
  };

  this.changePaginationLimit = function() {
    PaginationService.setPaginationLimit(this.tableKey, this.state.paginatedItemLimit);
  };

  this.applyFilters = function(value) {
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

  this.onStateFilterChange = function() {
    var filters = this.filters.state.values;
    var filtered = false;
    for (var i = 0; i < filters.length; i++) {
      var filter = filters[i];
      if (!filter.display) {
        filtered = true;
      }
    }
    this.filters.state.enabled = filtered;
    DatatableService.setDataTableFilters(this.tableKey, this.filters);
  };

  this.onSettingsContainerNameTruncateChange = function() {
    if (this.settings.truncateContainerName) {
      this.settings.containerNameTruncateSize = 32;
    } else {
      this.settings.containerNameTruncateSize = 256;
    }
    DatatableService.setDataTableSettings(this.tableKey, this.settings);
  };

  this.onSettingsQuickActionChange = function() {
    DatatableService.setDataTableSettings(this.tableKey, this.settings);
  };

  this.prepareTableFromDataset = function() {
    var availableStateFilters = [];
    for (var i = 0; i < this.dataset.length; i++) {
      var item = this.dataset[i];
      availableStateFilters.push({ label: item.Status, display: true });
    }
    this.filters.state.values = _.uniqBy(availableStateFilters, 'label');
  };

  this.updateStoredFilters = function(storedFilters) {
    var datasetFilters = this.filters.state.values;

    for (var i = 0; i < datasetFilters.length; i++) {
      var filter = datasetFilters[i];
      existingFilter = _.find(storedFilters, ['label', filter.label]);
      if (existingFilter && !existingFilter.display) {
        filter.display = existingFilter.display;
        this.filters.state.enabled = true;
      }
    }
  };

  this.$onInit = function() {
    setDefaults(this);
    this.prepareTableFromDataset();

    var storedOrder = DatatableService.getDataTableOrder(this.tableKey);
    if (storedOrder !== null) {
      this.state.reverseOrder = storedOrder.reverse;
      this.state.orderBy = storedOrder.orderBy;
    }

    var storedFilters = DatatableService.getDataTableFilters(this.tableKey);
    if (storedFilters !== null) {
      this.updateStoredFilters(storedFilters.state.values);
    }
    this.filters.state.open = false;

    var storedSettings = DatatableService.getDataTableSettings(this.tableKey);
    if (storedSettings !== null) {
      this.settings = storedSettings;
    }
    this.settings.open = false;

    var storedColumnVisibility = DatatableService.getColumnVisibilitySettings(this.tableKey);
    if (storedColumnVisibility !== null) {
      this.columnVisibility = storedColumnVisibility;
    }
    this.columnVisibility.state.open = false;
  };

  function setDefaults(ctrl) {
    ctrl.showTextFilter = ctrl.showTextFilter ? ctrl.showTextFilter : false;
    ctrl.state.reverseOrder = ctrl.reverseOrder ? ctrl.reverseOrder : false;
  }
}]);
