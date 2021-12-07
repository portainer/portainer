angular.module('portainer.docker').controller('VolumesDatatableController', [
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
        showUsedVolumes: true,
        showUnusedVolumes: true,
      },
    };

    this.applyFilters = function (value) {
      var volume = value;
      var filters = ctrl.filters;
      if ((volume.dangling && filters.state.showUnusedVolumes) || (!volume.dangling && filters.state.showUsedVolumes)) {
        return true;
      }
      return false;
    };

    this.applyFilters = anonymousVolumesFilters.bind(this);
    function anonymousVolumesFilters(value) {
      var volume = value;
      var isAnonymous = volume.Id.match('[A-z0-9]{32}') != null;
      if (isAnonymous && !this.settings.showAnonymousVolumes) {
        return false;
      }
      return true;
    }

    this.onstateFilterChange = function () {
      var filters = this.filters.state;
      var filtered = false;
      if (!filters.showUsedVolumes || !filters.showUnusedVolumes) {
        filtered = true;
      }
      this.filters.state.enabled = filtered;
      DatatableService.setDataTableFilters(this.tableKey, this.filters);
    };

    this.onSettingsAnonymousVolumesChange = function () {
      DatatableService.setDataTableSettings(this.tableKey, this.settings);
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
        if (typeof this.settings.showAnonymousVolumes == 'undefined') {
          // Anonymous volumes will be shown by default.
          this.settings.showAnonymousVolumes = true;
        }
      } else {
        // Anonymous volumes will be shown by default.
        this.settings.showAnonymousVolumes = true;
      }
      this.onSettingsRepeaterChange();
    };
  },
]);
