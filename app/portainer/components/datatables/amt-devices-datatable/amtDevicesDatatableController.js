angular.module('portainer.docker').controller('AMTDevicesDatatableController', [
  '$scope',
  '$controller',
  function ($scope, $controller) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

    // var ctrl = this;

    this.state = Object.assign(this.state, {
      showQuickActionStats: true,
      showQuickActionLogs: true,
      showQuickActionConsole: true,
      showQuickActionInspect: true,
      showQuickActionExec: true,
      showQuickActionAttach: false,
    });

    this.filters = {
      state: {
        open: false,
        enabled: false,
        values: [],
      },
    };

    this.$onInit = function () {
      this.setDefaults();
    };
  },
]);
