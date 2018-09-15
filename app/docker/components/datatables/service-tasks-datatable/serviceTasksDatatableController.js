angular.module('portainer.docker')
.controller('ServiceTasksDatatableController', ['DatatableService',
function (DatatableService) {
  var ctrl = this;

  this.state = {
    orderBy: this.orderBy
  };

  this.filters = {
    state: {
      open: false,
      enabled: false,
      values: []
    }
  };

  this.applyFilters = function(item) {
    var filters = ctrl.filters;
    for (var i = 0; i < filters.state.values.length; i++) {
      var filter = filters.state.values[i];
      if (item.Status.State === filter.label && filter.display) {
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
  };

  this.changeOrderBy = function(orderField) {
    this.state.reverseOrder = this.state.orderBy === orderField ? !this.state.reverseOrder : false;
    this.state.orderBy = orderField;
    DatatableService.setDataTableOrder(this.tableKey, orderField, this.state.reverseOrder);
  };

  this.prepareTableFromDataset = function() {
    var availableStateFilters = [];
    for (var i = 0; i < this.dataset.length; i++) {
      var item = this.dataset[i];
      availableStateFilters.push({ label: item.Status.State, display: true });
    }
    this.filters.state.values = _.uniqBy(availableStateFilters, 'label');
  };

  this.$onInit = function() {
    setDefaults(this);
    this.prepareTableFromDataset();

    var storedOrder = DatatableService.getDataTableOrder(this.tableKey);
    if (storedOrder !== null) {
      this.state.reverseOrder = storedOrder.reverse;
      this.state.orderBy = storedOrder.orderBy;
    }
  };

  function setDefaults(ctrl) {
    ctrl.state.reverseOrder = ctrl.reverseOrder ? ctrl.reverseOrder : false;
  }
}]);
