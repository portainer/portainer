import angular from 'angular';

export class EdgeStackEndpointsDatatableController {
  /* @ngInject */
  constructor($async, $scope, $controller, DatatableService, PaginationService, Notifications) {
    this.extendGenericController($controller, $scope);
    this.DatatableService = DatatableService;
    this.PaginationService = PaginationService;
    this.Notifications = Notifications;
    this.$async = $async;

    this.state = Object.assign(this.state, {
      orderBy: this.orderBy,
      loading: true,
      filteredDataSet: [],
      totalFilteredDataset: 0,
      pageNumber: 1,
    });

    this.onPageChange = this.onPageChange.bind(this);
    this.paginationChanged = this.paginationChanged.bind(this);
    this.paginationChangedAsync = this.paginationChangedAsync.bind(this);

    this.statusMap = {
      1: 'OK',
      2: 'Error',
      3: 'Acknowledged',
    };
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
    this.$async(this.paginationChangedAsync);
  }

  async paginationChangedAsync() {
    this.state.loading = true;
    this.state.filteredDataSet = [];
    const start = (this.state.pageNumber - 1) * this.state.paginatedItemLimit + 1;
    try {
      const { endpoints, totalCount } = await this.retrievePage(start, this.state.paginatedItemLimit, this.state.textFilter);
      this.state.filteredDataSet = endpoints;
      this.state.totalFilteredDataSet = totalCount;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve environments');
    } finally {
      this.state.loading = false;
    }
  }
}
