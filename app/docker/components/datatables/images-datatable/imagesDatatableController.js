angular.module('portainer.docker').controller('ImagesDatatableController', [
  '$scope',
  '$controller',
  'DatatableService',
  function ($scope, $controller, DatatableService) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

    var ctrl = this;

    this.filters = {
      state: {
        open: false,
        enabled: false,
        showUsedImages: true,
        showUnusedImages: true,
      },
    };

    this.applyFilters = function (value) {
      var image = value;
      var filters = ctrl.filters;
      if ((image.ContainerCount === 0 && filters.state.showUnusedImages) || (image.ContainerCount !== 0 && filters.state.showUsedImages)) {
        return true;
      }
      return false;
    };

    this.onstateFilterChange = function () {
      var filters = this.filters.state;
      var filtered = false;
      if (!filters.showUsedImages || !filters.showUnusedImages) {
        filtered = true;
      }
      this.filters.state.enabled = filtered;
      DatatableService.setDataTableFilters(this.tableKey, this.filters);
    };

    this.$onInit = function () {
      this.setDefaults();
      this.prepareTableFromDataset();

      this.state.orderBy = this.orderBy;
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

      var storedSettings = DatatableService.getDataTableSettings(this.tableKey);
      if (storedSettings !== null) {
        this.settings = storedSettings;
        this.settings.open = false;
      }

      this.onSettingsRepeaterChange();
    };
  },
]);
