angular.module('images', [])
.controller('ImagesController', ['$scope', '$state', 'Config', 'Image', 'ImageHelper', 'Messages', 'Pagination',
function ($scope, $state, Config, Image, ImageHelper, Messages, Pagination) {
  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('images');
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

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('images', $scope.state.pagination_count);
  };

  $scope.selectItems = function (allSelected) {
    angular.forEach($scope.state.filteredImages, function (image) {
      if (image.Checked !== allSelected) {
        image.Checked = allSelected;
        $scope.selectItem(image);
      }
    });
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  $scope.pullImage = function() {
    $('#pullImageSpinner').show();
    var image = $scope.config.Image;
    var registry = $scope.config.Registry;
    var imageConfig = ImageHelper.createImageConfigForContainer(image, registry);
    Image.create(imageConfig, function (data) {
        var err = data.length > 0 && data[data.length - 1].hasOwnProperty('error');
        if (err) {
          var detail = data[data.length - 1];
          $('#pullImageSpinner').hide();
          Messages.error('Error', {}, detail.error);
        } else {
          $('#pullImageSpinner').hide();
          $state.reload();
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
