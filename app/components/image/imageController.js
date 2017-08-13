angular.module('image', [])
.controller('ImageController', ['$q', '$scope', '$stateParams', '$state', '$timeout', 'ImageService', 'RegistryService', 'Notifications',
function ($q, $scope, $stateParams, $state, $timeout, ImageService, RegistryService, Notifications) {
	$scope.formValues = {
		Image: '',
		Registry: ''
	};

	$scope.sortType = 'Size';
  $scope.sortReverse = true;

	$scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

	$scope.toggleLayerCommand = function(layerId) {
		$('#layer-command-expander'+layerId+' span').toggleClass('glyphicon-plus-sign glyphicon-minus-sign');
		$('#layer-command-'+layerId+'-short').toggle();
		$('#layer-command-'+layerId+'-full').toggle();
	};

	$scope.tagImage = function() {
		$('#loadingViewSpinner').show();
		var image = $scope.formValues.Image;
		var registry = $scope.formValues.Registry;

		ImageService.tagImage($stateParams.id, image, registry.URL)
		.then(function success(data) {
			Notifications.success('Image successfully tagged');
			$state.go('image', {id: $stateParams.id}, {reload: true});
		})
		.catch(function error(err) {
			Notifications.error('Failure', err, 'Unable to tag image');
		})
		.finally(function final() {
			$('#loadingViewSpinner').hide();
		});
	};

	$scope.pushTag = function(repository) {
		$('#loadingViewSpinner').show();
		RegistryService.retrieveRegistryFromRepository(repository)
		.then(function success(data) {
			var registry = data;
			return ImageService.pushImage(repository, registry);
		})
		.then(function success(data) {
			Notifications.success('Image successfully pushed', repository);
		})
		.catch(function error(err) {
			Notifications.error('Failure', err, 'Unable to push image to repository');
		})
		.finally(function final() {
			$('#loadingViewSpinner').hide();
		});
	};

	$scope.pullTag = function(repository) {
		$('#loadingViewSpinner').show();
		RegistryService.retrieveRegistryFromRepository(repository)
		.then(function success(data) {
			var registry = data;
			return ImageService.pullImage(repository, registry, false);
		})
		.then(function success(data) {
			Notifications.success('Image successfully pulled', repository);
		})
		.catch(function error(err) {
			Notifications.error('Failure', err, 'Unable to pull image');
		})
		.finally(function final() {
			$('#loadingViewSpinner').hide();
		});
	};

	$scope.removeTag = function(repository) {
		$('#loadingViewSpinner').show();
		ImageService.deleteImage(repository, false)
		.then(function success() {
			if ($scope.image.RepoTags.length === 1) {
				Notifications.success('Image successfully deleted', repository);
				$state.go('images', {}, {reload: true});
			} else {
				Notifications.success('Tag successfully deleted', repository);
				$state.go('image', {id: $stateParams.id}, {reload: true});
			}
		})
		.catch(function error(err) {
			Notifications.error('Failure', err, 'Unable to remove image');
		})
		.finally(function final() {
			$('#loadingViewSpinner').hide();
		});
	};

	$scope.removeImage = function (id) {
		$('#loadingViewSpinner').show();
		ImageService.deleteImage(id, false)
		.then(function success() {
			Notifications.success('Image successfully deleted', id);
			$state.go('images', {}, {reload: true});
		})
		.catch(function error(err) {
			Notifications.error('Failure', err, 'Unable to remove image');
		})
		.finally(function final() {
			$('#loadingViewSpinner').hide();
		});
	};

	function initView() {
		$('#loadingViewSpinner').show();
		var endpointProvider = $scope.applicationState.endpoint.mode.provider;
		$q.all({
			image: ImageService.image($stateParams.id),
			history: endpointProvider !== 'VMWARE_VIC' ? ImageService.history($stateParams.id) : []
		})
		.then(function success(data) {
			$scope.image = data.image;
			$scope.history = data.history;
		})
		.catch(function error(err) {
			Notifications.error('Failure', err, 'Unable to retrieve image details');
			$state.go('images');
		})
		.finally(function final() {
			$('#loadingViewSpinner').hide();
		});
	}

	initView();
}]);
