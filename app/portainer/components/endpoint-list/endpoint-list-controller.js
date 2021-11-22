import _ from 'lodash-es';
import { PortainerEndpointTypes } from '@/portainer/models/endpoint/models';

const ENDPOINTS_POLLING_INTERVAL = 30000; // in ms
const ENDPOINTS_CACHE_SIZE = 100;

angular.module('portainer.app').controller('EndpointListController', [
  'DatatableService',
  'PaginationService',
  'ModalService',
  'KubernetesConfigService',
  'Notifications',
  function EndpointListController(DatatableService, PaginationService, ModalService, KubernetesConfigService, Notifications) {
    this.state = {
      totalFilteredEndpoints: null,
      textFilter: '',
      filteredEndpoints: [],
      paginatedItemLimit: '10',
      pageNumber: 1,
      loading: true,
      pollingTimeout: null,
    };

    this.onTextFilterChange = function (init = false) {
      this.state.loading = true;
      var filterValue = this.state.textFilter;
      DatatableService.setDataTableTextFilters(this.tableKey, filterValue);
      if (!init && this.hasBackendPagination()) {
        this.paginationChangedAction();
      } else {
        this.state.filteredEndpoints = frontEndpointFilter(this.endpoints, this.tags, filterValue);
        this.state.loading = false;
        if (filterValue) {
          this.state.totalFilteredEndpoints = this.state.filteredEndpoints.length;
        } else {
          this.state.totalFilteredEndpoints = this.endpoints.length;
        }
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

    this.getCurrentPage = async function (start, paginatedItemLimit, textFilter, init = false) {
      try {
        const { totalCount, endpoints } = await this.retrievePage(start, paginatedItemLimit, textFilter);
        if (init) {
          this.totalCount = totalCount;
          this.endpoints = endpoints;
          this.onTextFilterChange(init);
        } else {
          this.state.filteredEndpoints = endpoints;
          this.state.totalFilteredEndpoints = totalCount;
        }
        this.state.loading = false;

        const hasOfflineEndpoint = endpoints.some((e) => e.Status !== 1);
        if (hasOfflineEndpoint) {
          this.state.pollingTimeout = setTimeout(() => this.getCurrentPage(start, paginatedItemLimit, textFilter), ENDPOINTS_POLLING_INTERVAL);
        }
      } catch (err) {
        Notifications.error('Failed loading page data', err);
      }
    };

    this.paginationChangedAction = async function (init = false) {
      this.clearPollTimeout();
      if (init || this.hasBackendPagination()) {
        this.state.loading = true;
        this.state.filteredEndpoints = [];
        const start = (this.state.pageNumber - 1) * this.state.paginatedItemLimit + 1;
        if (init) {
          await this.getCurrentPage(start, ENDPOINTS_CACHE_SIZE, null, init);
        } else {
          await this.getCurrentPage(start, this.state.paginatedItemLimit, this.state.textFilter);
        }
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
      return [
        PortainerEndpointTypes.KubernetesLocalEnvironment,
        PortainerEndpointTypes.AgentOnKubernetesEnvironment,
        PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment,
      ].includes(endpoint.Type);
    }

    this.showKubeconfigModal = async function () {
      const kubeEnvironments = _.filter(this.endpoints, (endpoint) => isKubernetesMode(endpoint));
      const options = kubeEnvironments.map(function (environment) {
        return {
          text: `${environment.Name} (${environment.URL})`,
          value: environment.Id,
        };
      });

      let expiryMessage = '';
      try {
        expiryMessage = await KubernetesConfigService.expiryMessage();
      } catch (e) {
        Notifications.error('Failed fetching kubeconfig expiry time', e);
      }

      ModalService.confirmKubeconfigSelection(options, expiryMessage, async function (selectedEnvironmentIDs) {
        if (selectedEnvironmentIDs.length === 0) {
          Notifications.warning('No environment was selected');
          return;
        }
        try {
          await KubernetesConfigService.downloadKubeconfigFile(selectedEnvironmentIDs);
        } catch (e) {
          Notifications.error('Failed downloading kubeconfig file', e);
        }
      });
    };

    this.$onInit = function () {
      var textFilter = DatatableService.getDataTableTextFilters(this.tableKey);
      this.state.paginatedItemLimit = PaginationService.getPaginationLimit(this.tableKey);
      if (textFilter) {
        this.state.textFilter = textFilter;
      }
      this.paginationChangedAction(true);
    };
  },
]);
