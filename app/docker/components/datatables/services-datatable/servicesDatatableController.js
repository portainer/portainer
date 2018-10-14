import angular from 'angular';
import _ from 'lodash';

angular.module('portainer.docker')
.controller('ServicesDatatableController', ['PaginationService', 'DatatableService', 'EndpointProvider',
function (PaginationService, DatatableService, EndpointProvider) {

  var ctrl = this;

  this.state = {
    selectAll: false,
    expandAll: false,
    orderBy: this.orderBy,
    paginatedItemLimit: PaginationService.getPaginationLimit(this.tableKey),
    displayTextFilter: false,
    selectedItemCount: 0,
    selectedItems: [],
    expandedItems: [],
    publicURL: EndpointProvider.endpointPublicURL()
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

  this.expandAll = function() {
    this.state.expandAll = !this.state.expandAll;
    for (var i = 0; i < this.state.filteredDataSet.length; i++) {
      var item = this.state.filteredDataSet[i];
      this.expandItem(item, this.state.expandAll);
    }
  };

  this.changePaginationLimit = function() {
    PaginationService.setPaginationLimit(this.tableKey, this.state.paginatedItemLimit);
  };

  this.expandItem = function(item, expanded) {
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
    var expandedItem = _.find(storedExpandedItems, function(storedId) {
      return item.Id === storedId;
    });

    if (expandedItem) {
      ctrl.expandItem(item, true);
    }
  }

  this.expandItems = function(storedExpandedItems) {
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

  this.$onInit = function() {
    setDefaults(this);

    var storedOrder = DatatableService.getDataTableOrder(this.tableKey);
    if (storedOrder !== null) {
      this.state.reverseOrder = storedOrder.reverse;
      this.state.orderBy = storedOrder.orderBy;
    }

    var storedExpandedItems = DatatableService.getDataTableExpandedItems(this.tableKey);
    if (storedExpandedItems !== null) {
      this.expandItems(storedExpandedItems);
    }
  };

  function setDefaults(ctrl) {
    ctrl.showTextFilter = ctrl.showTextFilter ? ctrl.showTextFilter : false;
    ctrl.state.reverseOrder = ctrl.reverseOrder ? ctrl.reverseOrder : false;
  }
}]);
