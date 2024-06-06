import { processItemsInBatches } from '@/react/common/processItemsInBatches';

angular.module('portainer.docker').controller('SecretsController', [
  '$scope',
  '$state',
  'SecretService',
  'Notifications',
  function ($scope, $state, SecretService, Notifications) {
    $scope.removeAction = async function (selectedItems) {
      async function doRemove(secret) {
        return SecretService.remove(secret.Id)
          .then(function success() {
            Notifications.success('Secret successfully removed', secret.Name);
            var index = $scope.secrets.indexOf(secret);
            $scope.secrets.splice(index, 1);
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to remove secret');
          });
      }

      await processItemsInBatches(selectedItems, doRemove);
      $state.reload();
    };

    $scope.getSecrets = getSecrets;

    function getSecrets() {
      SecretService.secrets()
        .then(function success(data) {
          $scope.secrets = data;
        })
        .catch(function error(err) {
          $scope.secrets = [];
          Notifications.error('Failure', err, 'Unable to retrieve secrets');
        });
    }

    function initView() {
      getSecrets();
    }

    initView();
  },
]);
