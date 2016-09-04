angular.module('image', [])
.controller('ImageController', ['$scope', '$stateParams', '$state', 'Image', 'ImageHelper', 'Messages',
function ($scope, $stateParams, $state, Image, ImageHelper, Messages) {
  $scope.RepoTags = [];
  $scope.config = {
    Image: '',
    Registry: ''
  };

  // Get RepoTags from the /images/query endpoint instead of /image/json,
  // for backwards compatibility with Docker API versions older than 1.21
  function getRepoTags(imageId) {
    Image.query({}, function (d) {
      d.forEach(function(image) {
        if (image.Id === imageId && image.RepoTags[0] !== '<none>:<none>') {
          $scope.RepoTags = image.RepoTags;
        }
      });
    });
  }

  $scope.tagImage = function() {
    $('#loadingViewSpinner').show();
    var image = _.toLower($scope.config.Image);
    var registry = _.toLower($scope.config.Registry);
    var imageConfig = ImageHelper.createImageConfig(image, registry);
    Image.tag({id: $stateParams.id, tag: imageConfig.tag, repo: imageConfig.repo}, function (d) {
      Messages.send('Image successfully tagged');
      $('#loadingViewSpinner').hide();
      $state.go('image', {id: $stateParams.id}, {reload: true});
    }, function(e) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", e, "Unable to tag image");
    });
  };

  $scope.pushImage = function(tag) {
    $('#loadingViewSpinner').show();
    Image.push({tag: tag}, function (d) {
      if (d[d.length-1].error) {
        Messages.error("Unable to push image", {}, d[d.length-1].error);
      } else {
        Messages.send('Image successfully pushed');
      }
      $('#loadingViewSpinner').hide();
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", e, "Unable to push image");
    });
  };

  $scope.removeImage = function (id) {
    $('#loadingViewSpinner').show();
    Image.remove({id: id}, function (d) {
      if (d[0].message) {
        $('#loadingViewSpinner').hide();
        Messages.error("Unable to remove image", {}, d[0].message);
      } else {
        // If last message key is 'Deleted' or if it's 'Untagged' and there is only one tag associated to the image
        // then assume the image is gone and send to images page
        if (d[d.length-1].Deleted || (d[d.length-1].Untagged && $scope.RepoTags.length === 1)) {
          Messages.send('Image successfully deleted');
          $state.go('images', {}, {reload: true});
        } else {
          Messages.send('Tag successfully deleted');
          $state.go('image', {id: $stateParams.id}, {reload: true});
        }
      }
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", e, 'Unable to remove image');
    });
  };

  $('#loadingViewSpinner').show();
  Image.get({id: $stateParams.id}, function (d) {
    $scope.image = d;
    if (d.RepoTags) {
      $scope.RepoTags = d.RepoTags;
    } else {
      getRepoTags(d.Id);
    }
    $('#loadingViewSpinner').hide();
    $scope.exposedPorts = d.ContainerConfig.ExposedPorts ? Object.keys(d.ContainerConfig.ExposedPorts) : [];
    $scope.volumes = d.ContainerConfig.Volumes ? Object.keys(d.ContainerConfig.Volumes) : [];
  }, function (e) {
    Messages.error("Failure", e, "Unable to retrieve image info");
  });
}]);
