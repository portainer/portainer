const CUSTOM_TEMPLATES_TYPES = {
  SWARM: 1,
  STANDALONE: 2,
  KUBERNETES: 3,
};

angular.module('portainer.docker').controller('CustomTemplatesListController', function ($scope, $controller, DatatableService) {
  angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

  this.typeLabel = typeLabel;
  this.$onInit = $onInit;

  function typeLabel(type) {
    switch (type) {
      case CUSTOM_TEMPLATES_TYPES.SWARM:
        return 'swarm';
      case CUSTOM_TEMPLATES_TYPES.KUBERNETES:
        return 'manifest';
      case CUSTOM_TEMPLATES_TYPES.STANDALONE:
      default:
        return 'standalone';
    }
  }

  function $onInit() {
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
  }
});
