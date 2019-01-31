angular.module('portainer.app')
  .controller('ExtensionItemController', ['$state',
    function($state) {

      var ctrl = this;
      ctrl.goToExtensionView = goToExtensionView;

      function goToExtensionView() {
        if (ctrl.model.Available) {
          $state.go('portainer.extensions.extension', { id: ctrl.model.Id });
        }
      }
    }]);
