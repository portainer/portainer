angular.module('registryBrowseTags', [])
.controller('RegistryBrowseTagsController', ['$q', '$scope', '$transition$', 'RegistryService', 'Notifications',
function ($q, $scope, $transition$, RegistryService, Notifications) {

  $scope.state = {};
  $scope.tags = [];

  var blobs = [];
  var blobSizes = {};

  var registryID = $transition$.params().id;
  var repository = $transition$.params().repository;

  // Store info in tags and blobs arrays
  function storeManifests(allManifests) {
    for (var t in allManifests) {
      var tag = {};
      tag.name = allManifests[t].tag;
      tag.nb_layers = allManifests[t].fsLayers.length;
      tag.layers = allManifests[t].fsLayers.map(function (elem) {
        return elem.blobSum;
      });
      $scope.tags.push(tag);
      // Store associated blobs
      blobs = blobs.concat(tag.layers);
    }
    // Uniq on blobs array
    blobs = blobs.filter(function(elem, pos) {
      return blobs.indexOf(elem) == pos;
    });
  }

  // Store info in blobSizes object
  function storeBlobSizes(allBlobs) {
    for (var b in allBlobs) {
      var reference = allBlobs[b].headers['docker-content-digest'];
      var size = allBlobs[b].headers['content-length'];
      blobSizes[reference] = parseInt(size, 10);
    }
  }

  // Set total_size in tags array
  function storeTagSizes() {
    for (var t in $scope.tags) {
      var tag = $scope.tags[t].name;
      var size = 0
      for (l in $scope.tags[t].layers) {
        var reference = $scope.tags[t].layers[l];
        size += blobSizes[reference];
      }
      $scope.tags[t].total_size = size;
    }
  }

  // Retrieve all tags and their sizes
  function retrieveTags() {
    $scope.repository = repository;

    // Get all tags
    RegistryService.tags(registryID, repository)
    .then(function success(data) {
      
      // Prepare all queries to manifests
      var manifestsPromises = data.tags.map(function (tag) {
        return RegistryService.manifests(registryID, repository, tag);
      });

      // Query all manifests of all tags
      $q.all(manifestsPromises)
      .then(function(allManifests) {

        // Store manifests
        storeManifests(allManifests);

        // Now browse all blobs to find size for each tag, by associating blob to a size
        var blobsPromise = blobs.map(function (blob) {
          return RegistryService.blobs(registryID, repository, blob);
        });
        $q.all(blobsPromise)
        .then(function(allBlobs) {

          // Store blob sizes
          storeBlobSizes(allBlobs);

          // And then sum each tag.layers
          storeTagSizes();

        });

      });

    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve repository tags');
    });
  }

  // Retrieve registry object
  function retriveRegistry() {
    $scope.repository = repository;

    RegistryService.registry(registryID)
    .then(function success(data) {
      $scope.registry = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry details');
    });
  }

  function initView() {
    retriveRegistry();
    retrieveTags();
  }

  initView();
}]);
