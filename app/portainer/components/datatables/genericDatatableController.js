import _ from 'lodash-es';
import './datatable.css';

function isBetween(value, a, b) {
  return (value >= a && value <= b) || (value >= b && value <= a) ;
}

angular.module('portainer.app')
.controller('GenericDatatableController', ['PaginationService', 'DatatableService', 'PAGINATION_MAX_ITEMS',
function (PaginationService, DatatableService, PAGINATION_MAX_ITEMS) {

  this.state = {
    selectAll: false,
    orderBy: this.orderBy,
    paginatedItemLimit: PAGINATION_MAX_ITEMS,
    displayTextFilter: false,
    get selectedItemCount() {
      return this.selectedItems.length || 0;
    },
    selectedItems: []
  };


  this.onTextFilterChange = function() {
    DatatableService.setDataTableTextFilters(this.tableKey, this.state.textFilter);
  };

  this.changeOrderBy = function(orderField) {
    this.state.reverseOrder = this.state.orderBy === orderField ? !this.state.reverseOrder : false;
    this.state.orderBy = orderField;
    DatatableService.setDataTableOrder(this.tableKey, orderField, this.state.reverseOrder);
  };

  this.selectItem = function(item, event) {
    // Handle range select using shift
    if (event && event.originalEvent.shiftKey && this.state.firstClickedItem) {
      const firstItemIndex = this.state.filteredDataSet.indexOf(this.state.firstClickedItem);
      const lastItemIndex = this.state.filteredDataSet.indexOf(item);
      const itemsInRange = _.filter(this.state.filteredDataSet, (item, index) => {
        return isBetween(index, firstItemIndex, lastItemIndex);
      });
      const value = item.Checked;

      _.forEach(itemsInRange, (i) => {
        if (!this.allowSelection(i)) {
          return;
        }
        i.Checked = value;
      });
      this.state.firstClickedItem = item;
    } else if (event) {
      this.state.firstClickedItem = item;
    }
    this.state.selectedItems = this.state.filteredDataSet.filter(i => i.Checked);
    if (event && this.state.selectAll && this.state.selectedItems.length !== this.state.filteredDataSet.length) {
      this.state.selectAll = false;
    }
    this.onSelectionChanged();
  };

  this.selectAll = function() {
    this.state.firstClickedItem = null;
    for (var i = 0; i < this.state.filteredDataSet.length; i++) {
      var item = this.state.filteredDataSet[i];
      if (this.allowSelection(item) && item.Checked !== this.state.selectAll) {
        item.Checked = this.state.selectAll;
        this.selectItem(item);
      }
    }
    this.onSelectionChanged();
  };

  /**
   * Override this method to allow/deny selection
   */
  this.allowSelection = function(/*item*/) {
    return true;
  }

  /**
   * Override this method to prepare data table
   */
  this.prepareTableFromDataset = function() {
    return;
  }

  /**
   * Override this method to execute code after selection changed on datatable
   */
  this.onSelectionChanged = function () {
    return;
  }

  this.changePaginationLimit = function() {
    PaginationService.setPaginationLimit(this.tableKey, this.state.paginatedItemLimit);
  };

  this.setDefaults = function() {
    this.showTextFilter = this.showTextFilter ? this.showTextFilter : false;
    this.state.reverseOrder = this.reverseOrder ? this.reverseOrder : false;
    this.state.paginatedItemLimit = PaginationService.getPaginationLimit(this.tableKey);
  }

  this.$onInit = function() {
    this.setDefaults();
    this.prepareTableFromDataset();

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

    if(this.filters && this.filters.state) {
      this.filters.state.open = false;
    }
  };
}]);
