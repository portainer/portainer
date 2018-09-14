angular.module('portainer.app')
.controller('DeploykeysController', ['$scope', '$state', 'SshkeyService', 'Notifications', 'Authentication',
function ($scope, $state, SshkeyService, Notifications, Authentication) {

  $scope.state = {
    actionInProgress: false
  };

  $scope.formValues = {
    Name: ''
  };

  $scope.checkNameValidity = function(form) {
    var valid = true;
    for (var i = 0; i < $scope.deploykeys.length; i++) {
      if ($scope.formValues.Name === $scope.deploykeys[i].Name) {
        valid = false;
        break;
      }
    }
    form.name.$setValidity('validName', valid);
  };

  $scope.removeAction = function (selectedItems) {
    var actionCount = selectedItems.length;
    
    console.log(selectedItems);
    angular.forEach(selectedItems, function (deploykey) {
      console.log(deploykey);
      SshkeyService.deleteNewsshkey(deploykey.Id)
      .then(function success() {
        Notifications.success('Key successfully removed', deploykey.Name);
        var index = $scope.deploykeys.indexOf(deploykey);
        $scope.deploykeys.splice(index, 1);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to key');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  };

  $scope.createDeploykey = function() {
    var deploykeyName = $scope.formValues.Name;
    var userName = Authentication.getUserDetails().username;
    SshkeyService.createNewsshkey(deploykeyName,userName)
    .then(function success() {
      Notifications.success('Key successfully created', deploykeyName);
      $state.reload();
    })
    .catch(function error(err) {
      console.log(err);
      Notifications.error('Failure', err, 'Unable to create key');
    });
  };

  function initView() {
    SshkeyService.sshkeys()
    .then(function success(data) {
      console.log("vasudev");
      console.log(data);
      $scope.deploykeys = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve keys');
      $scope.deploykeys = [];
    });
  }

  initView();
}]);
