angular.module('portainer.integrations.storidge')
.controller('StoridgeNodesDatatableController', ['$scope', '$controller', 'clipboard', 'Notifications', 'StoridgeNodeService',
function($scope, $controller, clipboard, Notifications, StoridgeNodeService) {
  angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

  var ctrl = this;

  this.addNodeAction = function() {
    StoridgeNodeService.add()
      .then(function sucess(data) {
        ctrl.addInfo = data.content;
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to retrieve the "add node" command');
      });
  };

  this.copyAddNodeCommand = function() {
    clipboard.copyText(ctrl.addInfo);
    $('#copyNotification').show();
    $('#copyNotification').fadeOut(2000);
  };
}]);
