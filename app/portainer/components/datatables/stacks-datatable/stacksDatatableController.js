angular.module('portainer.app').controller('StacksDatatableController', [
  '$scope',
  '$controller',
  'DatatableService',
  'Authentication',
  function ($scope, $controller, DatatableService, Authentication) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

    this.filters = {
      state: {
        open: false,
        enabled: false,
        showActiveStacks: true,
        showUnactiveStacks: true,
      },
    };

    /**
     * Do not allow external items
     */
    this.allowSelection = function (item) {
      if (item.External && item.Type === 2) {
        return false;
      }

      return !(item.External && !this.isAdmin && !this.isEndpointAdmin);
    };

    this.applyFilters = applyFilters.bind(this);
    function applyFilters(stack) {
      const { showActiveStacks, showUnactiveStacks } = this.filters.state;
      return (stack.Status === 1 && showActiveStacks) || (stack.Status === 2 && showUnactiveStacks);
    }

    this.onFilterChange = onFilterChange.bind(this);
    function onFilterChange() {
      const { showActiveStacks, showUnactiveStacks } = this.filters.state;
      this.filters.state.enabled = !showActiveStacks || !showUnactiveStacks;
      DatatableService.setDataTableFilters(this.tableKey, this.filters);
    }

    this.$onInit = function () {
      this.isAdmin = Authentication.isAdmin();
      this.isEndpointAdmin = Authentication.hasAuthorizations(['EndpointResourcesAccess']);
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
