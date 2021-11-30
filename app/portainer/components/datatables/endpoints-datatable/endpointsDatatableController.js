import EndpointHelper from '@/portainer/helpers/endpointHelper';

angular.module('portainer.app').controller('EndpointsDatatableController', [
  '$scope',
  '$controller',
  'DatatableService',
  'PaginationService',
  'SettingsService',
  'OpenAMTService',
  function ($scope, $controller, DatatableService, PaginationService, SettingsService, OpenAMTService) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

    this.state = Object.assign(this.state, {
      orderBy: this.orderBy,
      loading: true,
      filteredDataSet: [],
      totalFilteredDataset: 0,
      pageNumber: 1,
      showAMTInfo: false,
      amtDevices: {},
      amtDevicesErrors: {},
    });

    this.paginationChanged = function () {
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
    };

    this.onPageChange = function (newPageNumber) {
      this.state.pageNumber = newPageNumber;
      this.paginationChanged();
    };

    /**
     * Overridden
     */
    this.onTextFilterChange = function () {
      var filterValue = this.state.textFilter;
      DatatableService.setDataTableTextFilters(this.tableKey, filterValue);
      this.paginationChanged();
    };

    /**
     * Overridden
     */
    this.changePaginationLimit = function () {
      PaginationService.setPaginationLimit(this.tableKey, this.state.paginatedItemLimit);
      this.paginationChanged();
    };

    this.setShowAMTInfo = async function () {
      this.settings = await SettingsService.settings();
      const featureFlagValue = this.settings && this.settings.FeatureFlagSettings && this.settings.FeatureFlagSettings['open-amt'];
      const featureEnabled = this.settings && this.settings.OpenAMTConfiguration && this.settings.OpenAMTConfiguration.Enabled;
      this.state.showAMTInfo = featureFlagValue && featureEnabled;
    };

    this.showAMTNodes = function (item) {
      return this.state.showAMTInfo && EndpointHelper.isAgentEndpoint(item) && item.AMTDeviceGUID;
    };

    this.expandItem = function (item, expanded) {
      if (!this.showAMTNodes(item)) {
        return;
      }

      item.Expanded = expanded;
      this.fetchAMTDeviceInfo(item);
    };

    this.fetchAMTDeviceInfo = function (endpoint) {
      if (!this.showAMTNodes(endpoint) || this.state.amtDevices[endpoint.Id]) {
        return;
      }

      OpenAMTService.getDevices(endpoint.Id)
        .then((data) => {
          this.state.amtDevices[endpoint.Id] = data.Devices;
        })
        .catch((e) => {
          console.log(e);
          this.state.amtDevicesErrors[endpoint.Id] = 'Error fetching devices information: ' + e.statusText;
        });
    };

    /**
     * Overridden
     */
    this.$onInit = async function () {
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
      if (this.filters && this.filters.state) {
        this.filters.state.open = false;
      }

      await this.setShowAMTInfo();
      this.paginationChanged();
    };
  },
]);
