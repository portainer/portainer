angular.module('images', [])
.controller('ImagesController', ['$scope', '$state', 'Image', 'ViewSpinner', 'Messages',
function ($scope, $state, Image, ViewSpinner, Messages) {
  $scope.state = {};
  $scope.sortType = 'Created';
  $scope.sortReverse = true;
  $scope.state.toggle = false;
  $scope.state.selectedItemCount = 0;

  $scope.config = {
    Image: ''
  };

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.toggleSelectAll = function () {
    angular.forEach($scope.state.filteredImages, function (i) {
      i.Checked = $scope.state.toggle;
    });
    if ($scope.state.toggle) {
      $scope.state.selectedItemCount = $scope.state.filteredImages.length;
    } else {
      $scope.state.selectedItemCount = 0;
    }
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  function createImageConfig(imageName) {
    var imageNameAndTag = imageName.split(':');
    var imageConfig = {
      fromImage: imageNameAndTag[0],
      tag: imageNameAndTag[1] ? imageNameAndTag[1] : 'latest'
    };
    return imageConfig;
  }

  $scope.pullImage = function() {
    ViewSpinner.spin();
    var image = _.toLower($scope.config.Image);
    var imageConfig = createImageConfig(image);
    Image.create(imageConfig, function (data) {
        var err = data.length > 0 && data[data.length - 1].hasOwnProperty('error');
        if (err) {
          var detail = data[data.length - 1];
          ViewSpinner.stop();
          Messages.error('Error', detail.error);
        } else {
          ViewSpinner.stop();
          $state.go('images', {}, {reload: true});
        }
    }, function (e) {
      ViewSpinner.stop();
      Messages.error('Error', 'Unable to pull image ' + image);
    });
  };

  $scope.removeAction = function () {
    ViewSpinner.spin();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        ViewSpinner.stop();
      }
    };
    angular.forEach($scope.images, function (i) {
      if (i.Checked) {
        counter = counter + 1;
        Image.remove({id: i.Id}, function (d) {
          angular.forEach(d, function (resource) {
            Messages.send("Image deleted", resource.Deleted);
          });
          var index = $scope.images.indexOf(i);
          $scope.images.splice(index, 1);
          complete();
        }, function (e) {
          Messages.error("Failure", e.data);
          complete();
        });
      }
    });
  };

  function fetchImages() {
    ViewSpinner.spin();
    Image.query({}, function (d) {
      $scope.images = d.map(function (item) {
        return new ImageViewModel(item);
      });
      ViewSpinner.stop();
    }, function (e) {
      Messages.error("Failure", e.data);
      ViewSpinner.stop();
    });
  }

  fetchImages();
}]);
