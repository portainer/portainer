angular.module('images', [])
.controller('ImagesController', ['$scope', '$state', 'ImageService', 'Notifications', 'Pagination', 'ModalService',
function ($scope, $state, ImageService, Notifications, Pagination, ModalService) {
  $scope.state = {
    pagination_count: Pagination.getPaginationCount('images'),
    actionInProgress: false,
    selectedItemCount: 0
  };

  $scope.sortType = 'RepoTags';
  $scope.sortReverse = true;

  function NewUsageFilter(text,icon) {
    var o = {};
    o.All =      { value:undefined, icon:'circle-o', class:'' };
    o[text[0]] = { value:'!',       icon:icon,       class:'' };
    o[text[1]] = { value:'',        icon:icon,       class:'emptylist' };
    return o;
  }

  $scope.UsageFilters = {
    Containers : {
      Options: NewUsageFilter(['Used','Unused'],'server'),
      Selected: 'All'
    },
    Children : {
      Options: NewUsageFilter(['HasChildren','NoChildren'],'clone'),
      Selected: 'All'
    },
    Tags : {
      Options: {
        All:      { value:undefined, icon:'circle-o', class:''          },
        Tagged:   { value:'',        icon:'tag',      class:''          },
        Untagged: { value:'!',       icon:'tag',      class:'emptylist' }
      },
      Selected: 'Tagged'
    }
  };

  $scope.formValues = {
    Image: '',
    Registry: ''
  };

  $scope.prettyList = function(obj) {
    if ( obj === 'None' ) { return obj; }
    var str = []; for ( var i=0; i < obj.length; i++ ) { str += (obj[i].NamesTags + '\x0A'); }
    return str;
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
    var image = $scope.formValues.Image;
    var registry = $scope.formValues.Registry;

    $scope.state.actionInProgress = true;
    ImageService.pullImage(image, registry, false)
    .then(function success(data) {
      Notifications.success('Image successfully pulled', image);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to pull image');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  $scope.confirmRemovalAction = function (force) {
    ModalService.confirmImageForceRemoval(function (confirmed) {
      if(!confirmed) { return; }
      $scope.removeAction(force);
    });
  };

  $scope.removeAction = function (force) {
    force = !!force;
    angular.forEach($scope.images, function (i) {
      if (i.Checked) {
        ImageService.deleteImage(i.Id, force)
        .then(function success(data) {
          Notifications.success('Image deleted', i.Id);
          var index = $scope.images.indexOf(i);
          $scope.images.splice(index, 1);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove image');
        });
      }
    });
  };

  function fetchImages() {
    var endpointProvider = $scope.applicationState.endpoint.mode.provider;
    var apiVersion = $scope.applicationState.endpoint.apiVersion;
    ImageService.images(true,'all')
    .then(function success(data) {
      $scope.images = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve images');
      $scope.images = [];
    });
  }

  fetchImages();
}]);
