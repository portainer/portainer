angular.module('image', [])
.controller('ImageController', ['$scope', '$stateParams', '$state', '$timeout', 'ImageService', 'RegistryService', 'Notifications',
function ($scope, $stateParams, $state, $timeout, ImageService, RegistryService, Notifications) {
	$scope.formValues = {
		Image: '',
		Registry: ''
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

	function retrieveImageDetails() {
		$('#loadingViewSpinner').show();
		ImageService.image($stateParams.id)
		.then(function success(data) {
			$scope.image = data;
		})
		.catch(function error(err) {
			Notifications.error('Failure', err, 'Unable to retrieve image details');
			$state.go('images');
		})
		.finally(function final() {
			$('#loadingViewSpinner').hide();
		});
	}

	retrieveImageDetails();
}]);
