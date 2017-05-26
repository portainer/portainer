angular.module('secrets', [])
.controller('SecretsController', ['$scope', '$stateParams', '$state', 'Secret', 'Notifications', 'Settings',
function ($scope, $stateParams, $state, Secret, Messages, Settings) {
  $scope.state = {};
  $scope.state.selectedItemCount = 0;
  $scope.sortType = 'Name';
  $scope.sortReverse = false;
  $scope.pagination_count = Settings.pagination_count;

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  $scope.removeAction = function () {
    $('#loadSecretsSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadSecretsSpinner').hide();
      }
    };
    angular.forEach($scope.secrets, function (secret) {
      if (secret.Checked) {
        counter = counter + 1;
        Secret.remove({id: secret.Id}, function (d) {
          if (d.message) {
            $('#loadSecretsSpinner').hide();
            Notifications.error('Unable to remove secret', {}, d[0].message);
          } else {
            Notifications.success('Secret deleted', secret.Id);
            var index = $scope.secrets.indexOf(secret);
            $scope.secrets.splice(index, 1);
          }
          complete();
        }, function (e) {
          Notifications.error('Failure', e, 'Unable to remove secret');
          complete();
        });
      }
    });
  };

  function fetchSecrets() {
    $('#loadSecretsSpinner').show();
    Secret.query({}, function (d) {
      $scope.secrets = d.map(function (secret) {
        return new SecretViewModel(secret);
      });
      $('#loadSecretsSpinner').hide();
    }, function(e) {
      $('#loadSecretsSpinner').hide();
      Notifications.error('Failure', e, 'Unable to retrieve secrets');
      $scope.secrets = [];
    });
  }

  fetchSecrets();
}]);
