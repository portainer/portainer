import _ from 'lodash-es';

angular.module('portainer.app').controller('EndpointListController', ['DatatableService', 'PaginationService',
  function EndpointListController(DatatableService, PaginationService) {
    this.state = {
      totalFilteredEndpoints: this.totalCount,
      textFilter: '',
      filteredEndpoints: [],
      paginatedItemLimit: '10',
      pageNumber: 1
    };

    this.$onChanges = function(changesObj) {
      this.handleEndpointsChange(changesObj.endpoints);
    }

    this.handleEndpointsChange = function(endpoints) {
      if (!endpoints || !endpoints.currentValue) {
        return;
      }
      this.onTextFilterChange();
    }

    this.onTextFilterChange = function() {
      var filterValue = this.state.textFilter;
      DatatableService.setDataTableTextFilters(this.tableKey, filterValue);
      if (this.hasBackendPagination()) {
        this.paginationChangedAction();
      } else {
        this.state.filteredEndpoints = frontEndpointFilter(this.endpoints, filterValue);
      }
    }

    function frontEndpointFilter(endpoints, filterValue) {
      if (!endpoints || !endpoints.length || !filterValue) {
        return endpoints;
      }
      var keywords = filterValue.split(' ');
      return _.filter(endpoints, function(endpoint) {
        var statusString = convertStatusToString(endpoint.Status);
        return _.every(keywords, function(keyword) {
          var lowerCaseKeyword = keyword.toLowerCase();
          return (
            _.includes(endpoint.Name.toLowerCase(), lowerCaseKeyword) ||
            _.includes(endpoint.GroupName.toLowerCase(), lowerCaseKeyword) ||
            _.includes(endpoint.URL.toLowerCase(), lowerCaseKeyword) ||
            _.some(endpoint.Tags, function(tag) {
              return _.includes(tag.toLowerCase(), lowerCaseKeyword);
            }) ||
            _.includes(statusString, keyword)
          );
        });
      });
    }

    this.hasBackendPagination = function() {
      return this.totalCount && this.totalCount > 100;
    }

    this.paginationChangedAction = function() {
      if (this.hasBackendPagination()) {
        const start = (this.state.pageNumber - 1) * this.state.paginatedItemLimit + 1;
        this.retrievePage(start, this.state.paginatedItemLimit, this.state.textFilter)
        .then((data) => {
          this.state.filteredEndpoints = data.endpoints;
          this.state.totalFilteredEndpoints = data.totalCount;
        });
      }
    }

    this.pageChangeHandler = function(newPageNumber) {
      this.state.pageNumber = newPageNumber;
      this.paginationChangedAction();
    }

    this.changePaginationLimit = function() {
      PaginationService.setPaginationLimit(this.tableKey, this.state.paginatedItemLimit);
      this.paginationChangedAction();
    };

    function convertStatusToString(status) {
      return status === 1 ? 'up' : 'down';
    }

    this.$onInit = function() {
      var textFilter = DatatableService.getDataTableTextFilters(this.tableKey);
      this.state.paginatedItemLimit = PaginationService.getPaginationLimit(this.tableKey);
      if (textFilter !== null) {
        this.state.textFilter = textFilter;
        this.onTextFilterChange();
      } else {
        this.paginationChangedAction();
      }
    }
  }
]);
