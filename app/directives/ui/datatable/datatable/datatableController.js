angular.module('ui')
.controller('DatatableController', ['$state', '$filter', '$sce', 'PaginationService', 'FilterService',
function ($state, $filter, $sce, PaginationService, FilterService) {

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


  function getPropertyByPath(obj, path) {
    path = path.replace(/\[(\w+)\]/g, '.$1');
    path = path.replace(/^\./, '');
    var a = path.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in obj) {
            obj = obj[k];
        } else {
            return;
        }
    }
    return obj;
  }

  this.renderField = function(prop, item) {
    var value = item[prop.property];
    if (!value) {
      value = getPropertyByPath(item, prop.property);
    }

    if (prop.renderFunc) {
      return $sce.trustAsHtml(prop.renderFunc(item, value));
    }
    if (prop.filter && value) {
      return $filter(prop.filter)(value);
    }

    return value ? value : '-';
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

  function setDefaults(ctrl) {
    ctrl.showTextFilter = ctrl.showTextFilter ? ctrl.showTextFilter : false;
    ctrl.selectableRows = ctrl.selectableRows ? ctrl.selectableRows : false;
    ctrl.state.reverseOrder = ctrl.reverseOrder ? ctrl.reverseOrder : false;
  }
}]);
