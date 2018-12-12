angular.module('portainer.app')
  .controller('ExtensionItemController', ['$state',
    function($state) {

      var ctrl = this;
      ctrl.$onInit = $onInit;
      ctrl.goToExtensionView = goToExtensionView;

      function goToExtensionView() {
        if (ctrl.model.Available) {
          $state.go('portainer.extensions.extension', { id: ctrl.model.Id });
        }
      }

      function $onInit() {
        if (ctrl.currentDate === ctrl.model.License.Expiration) {
          ctrl.model.Expired = true;
        }
      }
    }]);
