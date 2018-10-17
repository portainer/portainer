angular.module('portainer.docker')
  .controller('JobsDatatableController', ['$q', '$state', 'PaginationService', 'DatatableService', 'EndpointProvider', 'ContainerService', 'ModalService', 'Notifications',
    function ($q, $state, PaginationService, DatatableService, EndpointProvider, ContainerService, ModalService, Notifications) {
      var ctrl = this;

      this.state = {
        orderBy: this.orderBy,
        paginatedItemLimit: PaginationService.getPaginationLimit(this.tableKey),
        displayTextFilter: false,
        publicURL: EndpointProvider.endpointPublicURL()
      };

      this.filters = {
        state: {
          open: false,
          enabled: false,
          values: []
        }
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

      function confirmPurgeJobs() {
        return showConfirmationModal();

        function showConfirmationModal() {
          var deferred = $q.defer();

          ModalService.confirm({
            title: 'Are you sure ?',
            message: 'Purging jobs will remove all stopped jobs containers. Be sure to save your jobs logs if needed before performing this action.',
            buttons: {
              confirm: {
                label: 'Purge',
                className: 'btn-danger'
              }
            },
            callback: function onConfirm(confirmed) {
              deferred.resolve(confirmed);
            }
          });

          return deferred.promise;
        }
      }

      this.purgeAction = function () {
        confirmPurgeJobs().then(function success(confirmed) {
          if (!confirmed) {
            return $q.when();
          }
          ContainerService.purgeCompletedJobs().then(function success() {
            Notifications.success('Success', 'Jobs sucessfully purged.');
            $state.reload();
          }).catch(function error(err) {
            Notifications.error('Failure', err.message, 'Unable to purge jobs');
          });
        });
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
      };

      function setDefaults(ctrl) {
        ctrl.showTextFilter = ctrl.showTextFilter ? ctrl.showTextFilter : false;
        ctrl.state.reverseOrder = ctrl.reverseOrder ? ctrl.reverseOrder : false;
      }
    }
  ]);