angular.module('images', [])
.controller('ImagesController', ['$scope', '$state', 'Config', 'Image', 'Messages', 'Settings',
function ($scope, $state, Config, Image, Messages, Settings) {
  $scope.state = {};
  $scope.sortType = 'RepoTags';
  $scope.sortReverse = true;
  $scope.state.selectedItemCount = 0;
  $scope.state.checkedAll = false;
  $scope.pagination_count = Settings.pagination_count;

  $scope.config = {
    Image: '',
    Registry: ''
  };

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.selectAllItem = function () {
    if($scope.state.selectedItemCount==$scope.images.length){
      angular.forEach($scope.images, function (i) {
        i.Checked = false;
        $scope.state.selectedItemCount--;
      });
    } else {
      angular.forEach($scope.images, function (i) {
        if (!i.Checked) {
          i.Checked = true;
          $scope.state.selectedItemCount++;
        }
      });
    }
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
      if($scope.state.selectedItemCount==$scope.images.length){
        $scope.state.checkedAll = true;
      }
    } else {
      $scope.state.selectedItemCount--;
      if($scope.state.checkedAll){
        $scope.state.checkedAll = false;
      }
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
    var registry = _.toLower($scope.config.Registry);
    var imageConfig = createImageConfig(image, registry);
    Image.create(imageConfig, function (data) {
        var err = data.length > 0 && data[data.length - 1].hasOwnProperty('error');
        if (err) {
          var detail = data[data.length - 1];
          $('#pullImageSpinner').hide();
          Messages.error('Error', {}, detail.error);
        } else {
          $('#pullImageSpinner').hide();
          $state.go('images', {}, {reload: true});
        }
    }, function (e) {
      $('#pullImageSpinner').hide();
      Messages.error("Failure", e, "Unable to pull image");
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
            $('#loadImagesSpinner').hide();
            Messages.error("Unable to remove image", {}, d[0].message);
          } else {
            Messages.send("Image deleted", i.Id);
            var index = $scope.images.indexOf(i);
            $scope.images.splice(index, 1);
            $scope.state.selectedItemCount--;
            $scope.state.checkedAll = false;
          }
          complete();
        }, function (e) {
          Messages.error("Failure", e, 'Unable to remove image');
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
      $('#loadImagesSpinner').hide();
      Messages.error("Failure", e, "Unable to retrieve images");
      $scope.images = [];
    });
  }

  Config.$promise.then(function (c) {
    fetchImages();
  });
}]);
