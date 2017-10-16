angular.module('ui')
.controller('DatatableController', ['$state', 'PaginationService', 'FilterService',
function ($state, PaginationService, FilterService) {

  this.state = {
    selectAll: false,
    reverseOrder: false,
    orderBy: this.orderBy,
    paginatedItemLimit: PaginationService.getPaginationLimit(this.tableKey),
    displayFilter: false,
    selectedItemCount: 0,
    selectedItems: []
  };

  this.changeOrderBy = function(orderField) {
    this.state.reverseOrder = this.state.orderBy === orderField ? !this.state.reverseOrder : false;
    this.state.orderBy = orderField;
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

  this.goToDetails = function(item) {
    $state.go(this.stateDetails, { id: item[this.identifier] });
  };

  this.updateDisplayFilter = function() {
    this.state.displayFilter = !this.state.displayFilter;
    if (!this.state.displayFilter) {
      delete this.state.filter;
    }
  };

  this.storeColumnFilters = function() {
    FilterService.setDataTableHeaders(this.tableKey, this.headers);
  };

  this.$onInit = function() {
    var storedHeaders = FilterService.getDataTableHeaders(this.tableKey);
    if (storedHeaders !== null) {
      this.headers = storedHeaders;
    }
  };
}]);
