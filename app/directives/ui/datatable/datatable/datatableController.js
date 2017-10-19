angular.module('ui')
.controller('DatatableController', ['$state', '$filter', '$sce', 'PaginationService', 'FilterService',
function ($state, $filter, $sce, PaginationService, FilterService) {

  this.state = {
    selectAll: false,
    reverseOrder: false,
    orderBy: this.orderBy,
    paginatedItemLimit: PaginationService.getPaginationLimit(this.tableKey),
    displayTextFilter: false,
    filter: {},
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

  this.renderField = function(field, item) {
    var value = item[field] ? item[field] : '-';
    for (var i = 0; i < this.render.length; i++) {
      var renderer = this.render[i];
      if (renderer.field === field) {
        if (renderer.renderFunc) {
          return $sce.trustAsHtml(renderer.renderFunc(item, value));
        }
        if (renderer.filter && value) {
          return $filter(renderer.filter)(value);
        }
      }
    }

    return value;
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

  this.$onInit = function() {
    this.render = this.render ? this.render : [];

    var storedHeaders = FilterService.getDataTableHeaders(this.tableKey);
    if (storedHeaders !== null) {
      this.headers = storedHeaders;
    }

    var storedOrder = FilterService.getDataTableOrder(this.tableKey);
    if (storedOrder !== null) {
      this.state.reverseOrder = storedOrder.reverse;
      this.state.orderBy = storedOrder.orderBy;
    }
  };
}]);
