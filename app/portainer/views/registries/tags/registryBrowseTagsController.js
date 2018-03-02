angular.module('portainer.app')
.controller('RegistryBrowseTagsController', ['$q', '$scope', '$transition$', 'RegistryService', 'Notifications', 'ModalService',
function ($q, $scope, $transition$, RegistryService, Notifications, ModalService) {

  $scope.state = {};
  $scope.tags = [];
  $scope.digests = [];
  $scope.digest = null;

  var blobs = [];
  var blobSizes = {};

  var registryID = $transition$.params().id;
  var repository = $transition$.params().repository;
  var digestID = $transition$.params().digestid;

  // Store info in tags and blobs arrays
  function storeManifests(allManifests) {
    for (var t in allManifests) {
      if ({}.hasOwnProperty.call(allManifests, t)) {
        $scope.tags.push(allManifests[t]);
        // Store associated blobs
        blobs = blobs.concat(allManifests[t].Layers);
      }
    }
    // Uniq on blobs array
    blobs = blobs.filter(function(elem, pos) {
      return blobs.indexOf(elem) === pos;
    });
  }

  // Store info in blobSizes object
  function storeBlobSizes(allBlobs) {
    for (var b in allBlobs) {
      if ({}.hasOwnProperty.call(allBlobs, b)) {
        var reference = allBlobs[b].Reference;
        var size = allBlobs[b].Size;
        blobSizes[reference] = size;
      }
    }
  }

  // Set TotalSize in tags array
  function storeTagSizes() {
    for (var t in $scope.tags) {
      if ({}.hasOwnProperty.call($scope.tags, t)) {
        var tag = $scope.tags[t].TagName;
        var size = 0;
        for (l in $scope.tags[t].Layers) {
          if ({}.hasOwnProperty.call($scope.tags[t].Layers, l)) {
            var reference = $scope.tags[t].Layers[l];
            size += blobSizes[reference];
          }
        }
        $scope.tags[t].TotalSize = size;
      }
    }
  }

  function storeDigests() {
    var digestsObj = {};
    for (var t in $scope.tags) {
      if ({}.hasOwnProperty.call($scope.tags, t)) {
        var tag = $scope.tags[t];
        if (digestsObj[tag.Digest]) {
          digestsObj[tag.Digest].TagList.push(tag.TagName);
        } else {
          digestsObj[tag.Digest] = {'RepositoryName': tag.RepositoryName, 'Digest': tag.Digest, 'TagList': [tag.TagName], 'LayersCount': tag.LayersCount, 'TotalSize': tag.TotalSize, 'History': tag.History};
        }
      }
    }
    // Arrayfy
    $scope.digests = Object.keys(digestsObj).map(function (key) { return digestsObj[key]; });
  }

  // Retrieve all tags and their sizes
  function retrieveTags() {
    $scope.repository = repository;

    // Get all tags
    RegistryService.tags(registryID, repository)
    .then(function success(tags) {

      // Prepare all queries to manifests
      var manifestsPromises = tags.Tags.map(function (tag) {
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

          // Reorganize by digest
          storeDigests();

          // Store selected digest
          storeSelectedDigest();

        });

      });

    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve repository tags');
    });
  }

  // Retrieve registry object
  function retrieveRegistry() {
    $scope.repository = repository;

    RegistryService.registry(registryID)
    .then(function success(data) {
      $scope.registry = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry details');
    });
  }

  $scope.removeAction = function(selectedItems) {
    // TODO Get tagsCount
    var tagsCount = 2;
    ModalService.confirmDeletion(
      'Do you want to delete this digest? All associated tags will be unreachable.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        removeDigests(selectedItems);
      }
    );
  };

  function removeDigests(digests) {
    for (var d in digests) {
      var repository = digests[d].RepositoryName;
      var tag = digests[d].TagName;
      var digest = digests[d].Digest;
      RegistryService.deleteTag(registryID, repository, digest)
      .then(function success() {
        Notifications.success('Tag deleted', tag);
        // Reload view
        initView();
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to delete tag ' + tag);
      });
    }
  }

  function storeSelectedDigest() {
    if (digestID) {
      for (var d in $scope.digests) {
        if ({}.hasOwnProperty.call($scope.digests, d)) {
          if ($scope.digests[d].Digest === digestID) {
            $scope.digest = $scope.digests[d];
          }
        }
      }
      console.log($scope.digest);
    }
  }

  $scope.toggleLayerCommand = function(layerId) {
    $('#layer-command-expander'+layerId+' span').toggleClass('glyphicon-plus-sign glyphicon-minus-sign');
    $('#layer-command-'+layerId+'-short').toggle();
    $('#layer-command-'+layerId+'-full').toggle();
  };

  function initView() {
    $scope.tags = [];
    $scope.digests = [];
    blobs = [];
    blobSizes = {};

    retrieveRegistry();
    retrieveTags();
  }

  initView();
}]);
