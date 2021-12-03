angular.module('portainer.docker').controller('AMTDevicesDatatableController', [
  '$scope',
  '$controller',
  function ($scope, $controller) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

    this.parsePowerState = function (powerStateIntValue) {
      // https://app.swaggerhub.com/apis-docs/rbheopenamt/mps/1.4.0#/AMT/get_api_v1_amt_power_state__guid_
      switch (powerStateIntValue) {
        case 2:
          return 'Running';
        case 3:
        case 4:
          return 'Sleep';
        case 6:
        case 8:
        case 13:
          return 'Off';
        case 7:
          return 'Hibernate';
        case 9:
          return 'Power Cycle';
        default:
          return '-';
      }
    };

    this.$onInit = function () {
      this.setDefaults();
    };
  },
]);
