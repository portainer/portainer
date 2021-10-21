import _ from 'lodash-es';

angular.module('portainer.app').controller('EndpointListController', [
  'DatatableService',
  'PaginationService',
  'ModalService',
  'KubernetesConfigService',
  'Notifications',
  function EndpointListController(DatatableService, PaginationService, ModalService, KubernetesConfigService, Notifications) {
    this.state = {
      totalFilteredEndpoints: this.totalCount,
      textFilter: '',
      filteredEndpoints: [],
      paginatedItemLimit: '10',
      pageNumber: 1,
      loading: true,
    };

    this.$onChanges = function (changesObj) {
      this.handleEndpointsChange(changesObj.endpoints);
    };

    this.handleEndpointsChange = function (endpoints) {
      if (!endpoints || !endpoints.currentValue) {
        return;
      }
      this.onTextFilterChange();
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
      return this.totalCount && this.totalCount > 100;
    };

    this.paginationChangedAction = function () {
      if (this.hasBackendPagination()) {
        this.state.loading = true;
        this.state.filteredEndpoints = [];
        const start = (this.state.pageNumber - 1) * this.state.paginatedItemLimit + 1;
        this.retrievePage(start, this.state.paginatedItemLimit, this.state.textFilter).then((data) => {
          this.state.filteredEndpoints = data.endpoints;
          this.state.totalFilteredEndpoints = data.totalCount;
          this.state.loading = false;
        });
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

    this.showKubeconfigButton = function () {
      if (window.location.protocol !== 'https:') {
        return false;
      }
      return _.some(this.endpoints, (endpoint) => isKubernetesMode(endpoint));
    };

    function isKubernetesMode(endpoint) {
      return [5, 6, 7].indexOf(endpoint.Type) > -1;
    }

    this.showKubeconfigModal = async function () {
      const kubeEnvironments = _.filter(this.endpoints, (endpoint) => isKubernetesMode(endpoint));
      const options = kubeEnvironments.map(function (environment) {
        return {
          text: `${environment.Name} (${environment.URL})`,
          value: environment.Id,
        };
      });

      const expiryMessage = await KubernetesConfigService.expiryMessage();

      ModalService.confirmKubeconfigSelection(options, expiryMessage, async function (selectedEnvironmentIDs) {
        if (selectedEnvironmentIDs.length === 0) {
          Notifications.warning('No environment was selected');
          return;
        }
        await KubernetesConfigService.downloadKubeconfigFile(selectedEnvironmentIDs);
      });
    };

    this.$onInit = function () {
      var textFilter = DatatableService.getDataTableTextFilters(this.tableKey);
      this.state.paginatedItemLimit = PaginationService.getPaginationLimit(this.tableKey);
      if (textFilter !== null) {
        this.state.textFilter = textFilter;
      } else {
        this.paginationChangedAction();
      }
    };
  },
]);
