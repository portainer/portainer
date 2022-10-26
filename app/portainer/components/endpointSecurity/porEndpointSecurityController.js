angular.module('portainer.app').controller('porEndpointSecurityController', [
  '$scope',
  function ($scope) {
    var ctrl = this;

    ctrl.onToggleTLS = function (newValue) {
      $scope.$evalAsync(() => {
        ctrl.formData.TLS = newValue;
      });
    };

    ctrl.onToggleSkipVerify = function (newValue) {
      $scope.$evalAsync(() => {
        ctrl.formData.TLSSkipVerify = newValue;
      });
    };

    this.$onInit = $onInit;
    function $onInit() {
      if (ctrl.endpoint) {
        var endpoint = ctrl.endpoint;
        var TLS = endpoint.TLSConfig.TLS;
        ctrl.formData.TLS = TLS;
        var skipVerify = endpoint.TLSConfig.TLSSkipVerify;
        ctrl.formData.TLSSkipVerify = skipVerify;
      }
    }
  },
]);
