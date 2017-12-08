angular.module('registryBrowseTags', [])
.controller('RegistryBrowseTagsController', ['$q', '$scope', '$transition$', 'RegistryService', 'Notifications',
function ($q, $scope, $transition$, RegistryService, Notifications) {

  $scope.state = {};
  $scope.tags = [];

  var blobs_size = {};

  function initView() {
    var registryID = $transition$.params().id;
    var repository = $transition$.params().repository;
    $scope.repository = repository;

    RegistryService.tags(registryID, repository)
    .then(function success(data) {
      
      var manifestsPromises = data.tags.map(function (tag) {
        return RegistryService.manifests(registryID, repository, tag);
      });

      $q.all(manifestsPromises)
      .then(function(allManifests) {
        for (var t in allManifests) {
          var tag = {};
          tag.name = allManifests[t].tag;
          tag.nb_layers = allManifests[t].fsLayers.length;
          tag.layers = allManifests[t].fsLayers.map(function (elem) {
            return elem.blobSum;
          });
          blobsPromise = tag.layers.map(function (blob) {
            return RegistryService.blobs(registryID, repository, blob);
          });
          $scope.tags.push(tag);
        }

        // Now browse all blobs to find size for each tag, by associating blob to a size
        var blobs = [];
        for (var t in $scope.tags) {
          blobs = blobs.concat($scope.tags[t].layers);
        }
        blobs = blobs.filter(function(elem, pos) {
          return blobs.indexOf(elem) == pos;
        });

        var blobsPromise = blobs.map(function (blob) {
          return RegistryService.blobs(registryID, repository, blob);
        });
        $q.all(blobsPromise)
        .then(function(allBlobs) {
          for (var b in allBlobs) {
            var reference = allBlobs[b].headers['docker-content-digest'];
            var size = allBlobs[b].headers['content-length'];
            blobs_size[reference] = parseInt(size, 10);
          }

          // And then sum each tag.layers
          for (var t in $scope.tags) {
            var tag = $scope.tags[t].name;
            var size = 0
            for (l in $scope.tags[t].layers) {
              var reference = $scope.tags[t].layers[l];
              size += blobs_size[reference];
            }
            $scope.tags[t].total_size = size;
          }

        });

      });

      RegistryService.manifests(registryID, repository, data.tags[0])
      .then(function success(manif) {
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to retrieve repository tag manifests');
      });
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve repository tags');
    });

    RegistryService.registry(registryID)
    .then(function success(data) {
      $scope.registry = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry details');
    });
  }

  initView();
}]);
