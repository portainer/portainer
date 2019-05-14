import _ from 'lodash-es';

angular.module('portainer.docker')
  .controller('JobsDatatableController', ['$scope', '$controller', '$q', '$state', 'PaginationService', 'DatatableService', 'ContainerService', 'ModalService', 'Notifications',
    function ($scope, $controller, $q, $state, PaginationService, DatatableService, ContainerService, ModalService, Notifications) {

      const extendedCtrl = $controller('GenericDatatableController', {$scope: $scope});
      angular.extend(this, extendedCtrl);

      var ctrl = this;

      this.filters = {
        state: {
          open: false,
          enabled: false,
          values: []
        }
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
          var existingFilter = _.find(storedFilters, ['label', filter.label]);
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
            message: 'Clearing job history will remove all stopped jobs containers.',
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
          ContainerService.prune({ label: ['io.portainer.job.endpoint'] }).then(function success() {
            Notifications.success('Success', 'Job history cleared');
            $state.reload();
          }).catch(function error(err) {
            Notifications.error('Failure', err.message, 'Unable to clear job history');
          });
        });
      };

      this.$onInit = function () {
        extendedCtrl.$onInit();

        var storedFilters = DatatableService.getDataTableFilters(this.tableKey);
        if (storedFilters !== null) {
          this.updateStoredFilters(storedFilters.state.values);
        }
        this.filters.state.open = false;
      };
    }
  ]);
