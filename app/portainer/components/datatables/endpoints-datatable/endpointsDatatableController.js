import EndpointHelper from '@/portainer/helpers/endpointHelper';

import { activateDevice, getDevices } from 'Portainer/hostmanagement/open-amt/open-amt.service';

angular.module('portainer.app').controller('EndpointsDatatableController', [
  '$scope',
  '$async',
  '$state',
  '$controller',
  'DatatableService',
  'PaginationService',
  'SettingsService',
  'ModalService',
  'Notifications',
  function ($scope, $async, $state, $controller, DatatableService, PaginationService, SettingsService, ModalService, Notifications) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope, $async: $async }));

    this.state = Object.assign(this.state, {
      orderBy: this.orderBy,
      loading: true,
      filteredDataSet: [],
      totalFilteredDataset: 0,
      pageNumber: 1,
      showAMTInfo: false,
      amtDevices: {},
      amtDevicesErrors: {},
      showFDOInfo: false,
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

    this.setShowIntelInfo = async function () {
      this.settings = await SettingsService.settings();
      const openAMTFeatureFlagValue = this.settings && this.settings.FeatureFlagSettings && this.settings.FeatureFlagSettings['open-amt'];
      const openAMTFeatureEnabled = this.settings && this.settings.EnableEdgeComputeFeatures && this.settings.OpenAMTConfiguration && this.settings.OpenAMTConfiguration.Enabled;
      this.state.showAMTInfo = openAMTFeatureFlagValue && openAMTFeatureEnabled;

      const fdoFeatureFlagValue = this.settings && this.settings.FeatureFlagSettings && this.settings.FeatureFlagSettings['fdo'];
      const fdoFeatureEnabled = this.settings && this.settings.EnableEdgeComputeFeatures && this.settings.FDOConfiguration && this.settings.FDOConfiguration.Enabled;
      this.state.showFDOInfo = fdoFeatureFlagValue && fdoFeatureEnabled;
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
      $async(async () => {
        if (!this.showAMTNodes(endpoint) || this.state.amtDevices[endpoint.Id]) {
          return;
        }

        try {
          this.state.amtDevices[endpoint.Id] = await getDevices(endpoint.Id);
        } catch (e) {
          console.log(e);
          this.state.amtDevicesErrors[endpoint.Id] = e.message;
        }
      })

    };

    this.associateOpenAMT = function (endpoints) {
      const setLoadingMessage = this.setLoadingMessage;
      ModalService.confirm({
        title: 'Are you sure?',
        message: 'This operation will associate the selected environments with OpenAMT.',
        buttons: {
          confirm: {
            label: 'Associate',
            className: 'btn-primary',
          },
        },
        callback: async function onConfirm(confirmed) {
          if (!confirmed) {
            return;
          }

          $scope.$evalAsync(async () => {
            setLoadingMessage('Activating Active Management Technology on selected devices...');
            for (let endpoint of endpoints) {
              try {
                await activateDevice(endpoint.Id);

                Notifications.success('Successfully associated with OpenAMT', endpoint.Name);
              } catch (err) {
                Notifications.error('Failure', err, 'Unable to associate with OpenAMT');
              }
            }

            $state.reload();
          })
        },
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

      await this.setShowIntelInfo();
      this.paginationChanged();
    };
  },
]);
