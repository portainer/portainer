angular.module('images', [])
.controller('ImagesController', ['$scope', '$state', 'Config', 'Image', 'Messages',
function ($scope, $state, Config, Image, Messages) {
  $scope.state = {};
  $scope.sortType = 'RepoTags';
  $scope.sortReverse = true;
  $scope.state.selectedItemCount = 0;

  $scope.config = {
    Image: '',
    Registry: ''
  };

  $scope.order = function(sortType) {
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

  function createImageConfig(imageName, registry) {
    var imageNameAndTag = imageName.split(':');
    var image = imageNameAndTag[0];
    if (registry) {
      image = registry + '/' + imageNameAndTag[0];
    }
    var imageConfig = {
      fromImage: image,
      tag: imageNameAndTag[1] ? imageNameAndTag[1] : 'latest'
    };
    return imageConfig;
  }

  $scope.pullImage = function() {
    $('#pullImageSpinner').show();
    var image = _.toLower($scope.config.Image);
    var registry = $scope.config.Registry;
    var imageConfig = createImageConfig(image, registry);
    Image.create(imageConfig, function (data) {
        var err = data.length > 0 && data[data.length - 1].hasOwnProperty('error');
        if (err) {
          var detail = data[data.length - 1];
          $('#pullImageSpinner').hide();
          Messages.error('Error', detail.error);
        } else {
          $('#pullImageSpinner').hide();
          $state.go('images', {}, {reload: true});
        }
    }, function (e) {
      $('#pullImageSpinner').hide();
      Messages.error('Error', 'Unable to pull image ' + image);
    });
  };

  $scope.removeAction = function () {
    $('#loadImagesSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadImagesSpinner').hide();
      }
    };
    angular.forEach($scope.images, function (i) {
      if (i.Checked) {
        counter = counter + 1;
        Image.remove({id: i.Id}, function (d) {
          if (d[0].message) {
            $('#loadingViewSpinner').hide();
            Messages.error("Unable to remove image", d[0].message);
          } else {
            Messages.send("Image deleted", i.Id);
            var index = $scope.images.indexOf(i);
            $scope.images.splice(index, 1);
          }
          complete();
        }, function (e) {
          if (e.data.message) {
            Messages.error("Failure", e.data.message);
          } else {
            Messages.error("Failure", 'Unable to remove image');
          }
          complete();
        });
      }
    });
  };

  function fetchImages() {
    Image.query({}, function (d) {
      $scope.images = d.map(function (item) {
        return new ImageViewModel(item);
      });
      $('#loadImagesSpinner').hide();
    }, function (e) {
      Messages.error("Failure", e.data);
      $('#loadImagesSpinner').hide();
    });
  }

  Config.$promise.then(function (c) {
    $scope.availableRegistries = c.registries;
    fetchImages();
  });
}]);
