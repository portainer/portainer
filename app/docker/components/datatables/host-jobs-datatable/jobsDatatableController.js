angular.module('portainer.docker')
  .controller('JobsDatatableController', ['$q', 'PaginationService', 'DatatableService', 'EndpointProvider',
    function ($q, PaginationService, DatatableService, EndpointProvider) {
      var ctrl = this;

      this.state = {
        orderBy: this.orderBy,
        paginatedItemLimit: PaginationService.getPaginationLimit(this.tableKey),
        displayTextFilter: false,
        publicURL: EndpointProvider.endpointPublicURL()
      };

      this.settings = {
        open: false,
        truncateContainerId: true,
        containerIdTruncateSize: 32
      };

      this.filters = {
        state: {
          open: false,
          enabled: false,
          values: []
        }
      };

      this.columnVisibility = {
        state: {
          open: false
        },
        columns: {
          id: {
            label: 'Id',
            display: true
          },
          state: {
            label: 'Status',
            display: true
          },
          created: {
            label: 'Created',
            display: true
          }
        }
      };

      this.onColumnVisibilityChange = function () {
        DatatableService.setColumnVisibilitySettings(this.tableKey, this.columnVisibility);
      };

      this.changeOrderBy = function (orderField) {
        this.state.reverseOrder = this.state.orderBy === orderField ? !this.state.reverseOrder : false;
        this.state.orderBy = orderField;
        DatatableService.setDataTableOrder(this.tableKey, orderField, this.state.reverseOrder);
      };

      this.changePaginationLimit = function () {
        PaginationService.setPaginationLimit(this.tableKey, this.state.paginatedItemLimit);
      };

      this.applyFilters = function (value) {
        var container = value;
        var filters = ctrl.filters;
        for (var i = 0; i < filters.state.values.length; i++) {
          var filter = filters.state.values[i];
          if (container.Status === filter.label && filter.display) {
            return true;
          }
        }
        return false;
      };

      this.onStateFilterChange = function () {
        var filters = this.filters.state.values;
        var filtered = false;
        for (var i = 0; i < filters.length; i++) {
          var filter = filters[i];
          if (!filter.display) {
            filtered = true;
          }
        }
        this.filters.state.enabled = filtered;
        DatatableService.setDataTableFilters(this.tableKey, this.filters);
      };

      this.onSettingsContainerIdTruncateChange = function () {
        if (this.settings.truncateContainerId) {
          this.settings.containerIdTruncateSize = 32;
        } else {
          this.settings.containerIdTruncateSize = 256;
        }
        DatatableService.setDataTableSettings(this.tableKey, this.settings);
      };

      this.prepareTableFromDataset = function () {
        var availableStateFilters = [];
        for (var i = 0; i < this.dataset.length; i++) {
          var item = this.dataset[i];
          availableStateFilters.push({
            label: item.Status,
            display: true
          });
        }
        this.filters.state.values = _.uniqBy(availableStateFilters, 'label');
      };

      this.updateStoredFilters = function (storedFilters) {
        var datasetFilters = this.filters.state.values;

        for (var i = 0; i < datasetFilters.length; i++) {
          var filter = datasetFilters[i];
          existingFilter = _.find(storedFilters, ['label', filter.label]);
          if (existingFilter && !existingFilter.display) {
            filter.display = existingFilter.display;
            this.filters.state.enabled = true;
          }
        }
      };

      this.$onInit = function () {
        setDefaults(this);
        this.prepareTableFromDataset();

        var storedOrder = DatatableService.getDataTableOrder(this.tableKey);
        if (storedOrder !== null) {
          this.state.reverseOrder = storedOrder.reverse;
          this.state.orderBy = storedOrder.orderBy;
        }

        var storedFilters = DatatableService.getDataTableFilters(this.tableKey);
        if (storedFilters !== null) {
          this.updateStoredFilters(storedFilters.state.values);
        }
        this.filters.state.open = false;

        var storedSettings = DatatableService.getDataTableSettings(this.tableKey);
        if (storedSettings !== null) {
          this.settings = storedSettings;
        }
        this.settings.open = false;

        var storedColumnVisibility = DatatableService.getColumnVisibilitySettings(this.tableKey);
        if (storedColumnVisibility !== null) {
          this.columnVisibility = storedColumnVisibility;
        }
        this.columnVisibility.state.open = false;
      };

      function setDefaults(ctrl) {
        ctrl.showTextFilter = ctrl.showTextFilter ? ctrl.showTextFilter : false;
        ctrl.state.reverseOrder = ctrl.reverseOrder ? ctrl.reverseOrder : false;
      }
    }
  ]);