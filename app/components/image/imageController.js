angular.module('image', [])
.controller('ImageController', ['$scope', '$q', '$stateParams', '$state', 'Image', 'Container', 'Messages', 'LineChart',
function ($scope, $q, $stateParams, $state, Image, Container, Messages, LineChart) {
  $scope.tagInfo = {repo: '', version: '', force: false};
  $scope.id = '';
  $scope.repoTags = [];

  $scope.removeImage = function (id) {
    Image.remove({id: id}, function (d) {
      d.forEach(function(msg){
        var key = Object.keys(msg)[0];
        Messages.send(key, msg[key]);
      });
      // If last message key is 'Deleted' then assume the image is gone and send to images page
      if (d[d.length-1].Deleted) {
        $state.go('images', {}, {reload: true});
      } else {
        $state.go('image', {id: $scope.id}, {reload: true});
      }
    }, function (e) {
      $scope.error = e.data;
      $('#error-message').show();
    });
  };

  /**
  * Get RepoTags from the /images/query endpoint instead of /image/json,
  * for backwards compatibility with Docker API versions older than 1.21
  * @param {string} imageId
  */
  function getRepoTags(imageId) {
    Image.query({}, function (d) {
      d.forEach(function(image) {
        if (image.Id === imageId && image.RepoTags[0] !== '<none>:<none>') {
          $scope.RepoTags = image.RepoTags;
        }
      });
    });
  }

  Image.get({id: $stateParams.id}, function (d) {
    $scope.image = d;
    $scope.id = d.Id;
    if (d.RepoTags) {
      $scope.RepoTags = d.RepoTags;
    } else {
      getRepoTags($scope.id);
    }
  }, function (e) {
    if (e.status === 404) {
      $('.detail').hide();
      $scope.error = "Image not found.<br />" + $stateParams.id;
    } else {
      $scope.error = e.data;
    }
    $('#error-message').show();
  });
}]);
