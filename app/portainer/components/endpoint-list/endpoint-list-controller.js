import _ from 'lodash-es';

const ENDPOINTS_POLLING_INTERVAL = 30000; // in ms
const ENDPOINTS_CACHE_SIZE = 100;

angular.module('portainer.app').controller('EndpointListController', [
  'DatatableService',
  'PaginationService',
  function EndpointListController(DatatableService, PaginationService) {
    this.state = {
      totalFilteredEndpoints: this.totalCount,
      textFilter: '',
      filteredEndpoints: [],
      paginatedItemLimit: '10',
      pageNumber: 1,
      loading: true,
    };

    this.onTextFilterChange = function () {
      this.state.loading = true;
      var filterValue = this.state.textFilter;
      DatatableService.setDataTableTextFilters(this.tableKey, filterValue);
      if (this.hasBackendPagination()) {
        this.paginationChangedAction();
      } else {
        this.state.filteredEndpoints = frontEndpointFilter(this.endpoints, this.tags, filterValue);
        this.state.loading = false;
      }
    };

    function frontEndpointFilter(endpoints, tags, filterValue) {
      if (!endpoints || !endpoints.length || !filterValue) {
        return endpoints;
      }
      var keywords = filterValue.split(' ');
      return _.filter(endpoints, function (endpoint) {
        var statusString = convertStatusToString(endpoint.Status);
        return _.every(keywords, function (keyword) {
          var lowerCaseKeyword = keyword.toLowerCase();
          return (
            _.includes(endpoint.Name.toLowerCase(), lowerCaseKeyword) ||
            _.includes(endpoint.GroupName.toLowerCase(), lowerCaseKeyword) ||
            _.includes(endpoint.URL.toLowerCase(), lowerCaseKeyword) ||
            _.some(endpoint.TagIds, (tagId) => {
              const tag = tags.find((t) => t.Id === tagId);
              if (!tag) {
                return false;
              }
              return _.includes(tag.Name.toLowerCase(), lowerCaseKeyword);
            }) ||
            _.includes(statusString, keyword)
          );
        });
      });
    }

    this.hasBackendPagination = function () {
      return this.totalCount && this.totalCount > ENDPOINTS_CACHE_SIZE;
    };

    this.clearPollTimeout = function () {
      if (this.state.pollingTimeout) {
        clearTimeout(this.state.pollingTimeout);
        this.state.pollingTimeout = 0;
      }
    };

    this.$onDestory = function () {
      this.clearPollTimeout();
    };

    this.getCurrentPage = function (start, paginatedItemLimit, textFilter) {
      this.retrievePage(start, paginatedItemLimit, textFilter).then((data) => {
        this.state.filteredEndpoints = data.endpoints;
        this.state.totalFilteredEndpoints = data.totalCount;
        this.state.loading = false;
        this.totalCount = data.totalCount;
        this.endpoints = data.endpoints;

        const hasOfflineEndpoint = data.endpoints.some((e) => e.Status !== 1);
        if (hasOfflineEndpoint) {
          this.state.pollingTimeout = setTimeout(() => this.getCurrentPage(start, paginatedItemLimit, textFilter), ENDPOINTS_POLLING_INTERVAL);
        }
      });
    };

    this.paginationChangedAction = function () {
      this.clearPollTimeout();
      if (this.state.pageNumber === 1 || this.hasBackendPagination()) {
        this.state.loading = true;
        this.state.filteredEndpoints = [];
        const start = (this.state.pageNumber - 1) * this.state.paginatedItemLimit + 1;

        this.getCurrentPage(start, this.state.pageNumber === 1 ? ENDPOINTS_CACHE_SIZE : this.state.paginatedItemLimit, this.state.textFilter);
      }
    };

    this.pageChangeHandler = function (newPageNumber) {
      this.state.pageNumber = newPageNumber;
      this.paginationChangedAction();
    };

    this.changePaginationLimit = function () {
      PaginationService.setPaginationLimit(this.tableKey, this.state.paginatedItemLimit);
      this.paginationChangedAction();
    };

    function convertStatusToString(status) {
      return status === 1 ? 'up' : 'down';
    }

    this.$onInit = function () {
      var textFilter = DatatableService.getDataTableTextFilters(this.tableKey);
      this.state.paginatedItemLimit = PaginationService.getPaginationLimit(this.tableKey);
      if (textFilter) {
        this.state.textFilter = textFilter;
      }

      this.paginationChangedAction();
    };
  },
]);
