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
      if (item.Checked && item.Status === 'paused') {
        this.state.noPausedItemsSelected = false;
      } else if (item.Checked && (item.Status === 'stopped' || item.Status === 'created')) {
        this.state.noStoppedItemsSelected = false;
      } else if (item.Checked && item.Status === 'running') {
        this.state.noRunningItemsSelected = false;
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

  this.$onInit = function() {
    setDefaults(this);
    this.setSelectedItems();

    var storedOrder = FilterService.getDataTableOrder(this.tableKey);
    if (storedOrder !== null) {
      this.state.reverseOrder = storedOrder.reverse;
      this.state.orderBy = storedOrder.orderBy;
    }
  };

  this.setSelectedItems = function() {
    for (var i = 0; i < this.dataset.length; i++) {
      var item = this.dataset[i];
      if (item.Checked) {
        this.selectItem(item);
      }
    }
  };

  function setDefaults(ctrl) {
    ctrl.showTextFilter = ctrl.showTextFilter ? ctrl.showTextFilter : false;
    ctrl.state.reverseOrder = ctrl.reverseOrder ? ctrl.reverseOrder : false;
  }
}]);
