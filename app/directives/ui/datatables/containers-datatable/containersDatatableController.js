angular.module('ui')
.controller('ContainersDatatableController', ['PaginationService', 'FilterService',
function (PaginationService, FilterService) {

  this.state = {
    selectAll: false,
    orderBy: this.orderBy,
    paginatedItemLimit: PaginationService.getPaginationLimit(this.tableKey),
    displayTextFilter: false,
    selectedItemCount: 0,
    selectedItems: []
  };

  this.changeOrderBy = function(orderField) {
    this.state.reverseOrder = this.state.orderBy === orderField ? !this.state.reverseOrder : false;
    this.state.orderBy = orderField;
    FilterService.setDataTableOrder(this.tableKey, orderField, this.state.reverseOrder);
  };

  this.selectItem = function(item) {
    if (item.Checked) {
      this.state.selectedItemCount++;
      this.state.selectedItems.push(item);
    } else {
      this.state.selectedItems.splice(this.state.selectedItems.indexOf(item), 1);
      this.state.selectedItemCount--;
    }
    this.updateSelectionFlags();
  };

  this.selectAll = function() {
    for (var i = 0; i < this.state.filteredDataSet.length; i++) {
      var item = this.state.filteredDataSet[i];
      if (item.Checked !== this.state.selectAll) {
        item.Checked = this.state.selectAll;
        this.selectItem(item);
      }
    }
    this.updateSelectionFlags();
  };

  this.updateSelectionFlags = function() {
    this.state.noStoppedItemsSelected = true;
    this.state.noRunningItemsSelected = true;
    this.state.noPausedItemsSelected = true;

    for (var i = 0; i < this.dataset.length; i++) {
      var item = this.dataset[i];
      if (!item.Checked) {
        return;
      }

      if (item.Status === 'paused') {
        this.state.noPausedItemsSelected = false;
      } else if(item.Status === 'stopped' || item.Status === 'created') {
        this.state.noStoppedItemsSelected = false;
      } else if(item.Status === 'running') {
        this.state.noRunningItemsSelected = false;
      }

    }
  };

  this.changePaginationLimit = function() {
    PaginationService.setPaginationLimit(this.tableKey, this.state.paginatedItemLimit);
  };

  this.updatedisplayTextFilter = function() {
    this.state.displayTextFilter = !this.state.displayTextFilter;
    if (!this.state.displayTextFilter) {
      delete this.state.textFilter;
    }
  };

  this.storeColumnFilters = function() {
    FilterService.setDataTableHeaders(this.tableKey, this.headers);
  };

  this.updateFilter = function(filter) {
    this.state.filter = filter;
  };

  this.$onInit = function() {
    setDefaults(this);

    var storedOrder = FilterService.getDataTableOrder(this.tableKey);
    if (storedOrder !== null) {
      this.state.reverseOrder = storedOrder.reverse;
      this.state.orderBy = storedOrder.orderBy;
    }
  };

  function setDefaults(ctrl) {
    ctrl.showTextFilter = ctrl.showTextFilter ? ctrl.showTextFilter : false;
    ctrl.state.reverseOrder = ctrl.reverseOrder ? ctrl.reverseOrder : false;
  }
}]);
