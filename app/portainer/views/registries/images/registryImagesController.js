angular.module('portainer.app')
  .controller('RegistryImagesController', ['$q', '$transition$', '$scope', '$state', 'RegistryService', 'LocalRegistryService', 'ModalService', 'Notifications',
    function ($q, $transition$, $scope, $state, RegistryService, LocalRegistryService, ModalService, Notifications) {

      $scope.state = {
        actionInProgress: false
      };
      $scope.images = [];
      $scope.registry = {};

      $scope.removeImages = function(selectedItems) {
        ModalService.confirmDeletion(
          'This action will only remove the manifests linked to the selected images. You need to manually trigger a garbage collector pass on your registry to remove orphan layers if you want to remove the images content.',
          function onConfirm(confirmed) {
            if (!confirmed) {
              return;
            }
            var promises = [];
            selectedItems.map(function (item) {
              promises.push(LocalRegistryService.deleteManifest($scope.registry.Id, item.Name, item.Digest));
            });
            $q.all(promises).then(function success(data) {
                Notifications.success('Success', 'Images successfully deleted');
                $state.reload();
              })
              .catch(function error(err) {
                Notifications.error('Failure', err, 'Unable to delete images');
              });
          });
      };

      function initView() {
        var registryId = $transition$.params().id;
        $q.all({
          registry: RegistryService.registry(registryId),
          images: LocalRegistryService.images(registryId)
        }).then(function success(data) {
          $scope.registry = data.registry;
          $scope.images = data.images;
        }).catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve registry details');
        });
      }
      initView();
    }
  ]);