import angular from 'angular';

export class AssociatedEndpointsDatatableController {
  /* @ngInject */
  constructor($scope, $controller, DatatableService, PaginationService) {
    this.extendGenericController($controller, $scope);
    this.DatatableService = DatatableService;
    this.PaginationService = PaginationService;

    this.state = Object.assign(this.state, {
      orderBy: this.orderBy,
      loading: true,
      filteredDataSet: [],
      totalFilteredDataset: 0,
      pageNumber: 1,
    });

    this.onPageChange = this.onPageChange.bind(this);
    this.paginationChanged = this.paginationChanged.bind(this);
  }

  extendGenericController($controller, $scope) {
    // extending the controller overrides the current controller functions
    const $onInit = this.$onInit.bind(this);
    const changePaginationLimit = this.changePaginationLimit.bind(this);
    const onTextFilterChange = this.onTextFilterChange.bind(this);
    angular.extend(this, $controller('GenericDatatableController', { $scope }));
    this.$onInit = $onInit;
    this.changePaginationLimit = changePaginationLimit;
    this.onTextFilterChange = onTextFilterChange;
  }

  $onInit() {
    this.setDefaults();
    this.prepareTableFromDataset();

    var storedOrder = this.DatatableService.getDataTableOrder(this.tableKey);
    if (storedOrder !== null) {
      this.state.reverseOrder = storedOrder.reverse;
      this.state.orderBy = storedOrder.orderBy;
    }

    var textFilter = this.DatatableService.getDataTableTextFilters(this.tableKey);
    if (textFilter !== null) {
      this.state.textFilter = textFilter;
      this.onTextFilterChange();
    }

    var storedFilters = this.DatatableService.getDataTableFilters(this.tableKey);
    if (storedFilters !== null) {
      this.filters = storedFilters;
    }
    if (this.filters && this.filters.state) {
      this.filters.state.open = false;
    }

    this.paginationChanged();
  }

  $onChanges({ updateKey }) {
    if (updateKey.currentValue && !updateKey.isFirstChange()) {
      this.paginationChanged();
    }
  }

  onPageChange(newPageNumber) {
    this.state.pageNumber = newPageNumber;
    this.paginationChanged();
  }

  /**
   * Overridden
   */
  changePaginationLimit() {
    this.PaginationService.setPaginationLimit(this.tableKey, this.state.paginatedItemLimit);
    this.paginationChanged();
  }

  /**
   * Overridden
   */
  onTextFilterChange() {
    var filterValue = this.state.textFilter;
    this.DatatableService.setDataTableTextFilters(this.tableKey, filterValue);
    this.paginationChanged();
  }

  paginationChanged() {
    this.state.loading = true;
    this.state.filteredDataSet = [];
    const start = (this.state.pageNumber - 1) * this.state.paginatedItemLimit + 1;
    this.retrievePage(start, this.state.paginatedItemLimit, this.state.textFilter)
      .then((data) => {
        this.state.filteredDataSet = data.endpoints;
        this.state.totalFilteredDataSet = data.totalCount;
      })
      .finally(() => {
        this.state.loading = false;
      });
  }
}
