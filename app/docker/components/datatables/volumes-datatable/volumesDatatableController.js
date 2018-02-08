angular.module('portainer.docker')
.controller('VolumesDatatableController', ['PaginationService', 'DatatableService',
function (PaginationService, DatatableService) {

  var ctrl = this;

  this.state = {
    selectAll: false,
    orderBy: this.orderBy,
    paginatedItemLimit: PaginationService.getPaginationLimit(this.tableKey),
    displayTextFilter: false,
    selectedItemCount: 0,
    selectedItems: []
  };
  
  this.filters = {
    usage: {
      open: false,
      enabled: false,
      showUsedVolumes: true,
      showUnusedVolumes: true
    }
  };

  this.changeOrderBy = function(orderField) {
    this.state.reverseOrder = this.state.orderBy === orderField ? !this.state.reverseOrder : false;
    this.state.orderBy = orderField;
    DatatableService.setDataTableOrder(this.tableKey, orderField, this.state.reverseOrder);
  };

  this.selectItem = function(item) {
    if (item.Checked) {
      this.state.selectedItemCount++;
      this.state.selectedItems.push(item);
    } else {
      this.state.selectedItems.splice(this.state.selectedItems.indexOf(item), 1);
      this.state.selectedItemCount--;
    }
  };

  this.selectAll = function() {
    for (var i = 0; i < this.state.filteredDataSet.length; i++) {
      var item = this.state.filteredDataSet[i];
      if (item.Checked !== this.state.selectAll) {
        item.Checked = this.state.selectAll;
        this.selectItem(item);
      }
    }
  };

  this.changePaginationLimit = function() {
    PaginationService.setPaginationLimit(this.tableKey, this.state.paginatedItemLimit);
  };

  this.updateDisplayTextFilter = function() {
    this.state.displayTextFilter = !this.state.displayTextFilter;
    if (!this.state.displayTextFilter) {
      delete this.state.textFilter;
    }
  };
  
  this.applyFilters = function(value, index, array) {
    var volume = value;
    var filters = ctrl.filters;
    if ((volume.dangling && filters.usage.showUnusedVolumes) 
      || (!volume.dangling && filters.usage.showUsedVolumes)) {
      return true;
    }
    return false;
  };
  
  this.onUsageFilterChange = function() {
    var filters = this.filters.usage;
    var filtered = false;
    if (!filters.showUsedVolumes || !filters.showUnusedVolumes) {
      filtered = true;
    }
    this.filters.usage.enabled = filtered;
    DatatableService.setDataTableFilters(this.tableKey, this.filters);
  };

  this.$onInit = function() {
    setDefaults(this);

    var storedOrder = DatatableService.getDataTableOrder(this.tableKey);
    if (storedOrder !== null) {
      this.state.reverseOrder = storedOrder.reverse;
      this.state.orderBy = storedOrder.orderBy;
    }
    
    var storedFilters = DatatableService.getDataTableFilters(this.tableKey);
    if (storedFilters !== null) {
      this.filters = storedFilters;
    }
    this.filters.usage.open = false;
  };

  function setDefaults(ctrl) {
    ctrl.showTextFilter = ctrl.showTextFilter ? ctrl.showTextFilter : false;
    ctrl.state.reverseOrder = ctrl.reverseOrder ? ctrl.reverseOrder : false;
  }
}]);
