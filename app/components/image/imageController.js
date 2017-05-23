angular.module('image', [])
.controller('ImageController', ['$scope', '$stateParams', '$state', 'ImageService', 'Notifications',
function ($scope, $stateParams, $state, ImageService, Notifications) {
	$scope.config = {
		Image: '',
		Registry: ''
	};

	$scope.tagImage = function() {
		$('#loadingViewSpinner').show();
		var image = $scope.config.Image;
		var registry = $scope.config.Registry;

		ImageService.tagImage($stateParams.id, image, registry)
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

	$scope.pushTag = function(tag) {
		$('#loadingViewSpinner').show();
		ImageService.pushImage(tag)
		.then(function success() {
			Notifications.success('Image successfully pushed');
		})
		.catch(function error(err) {
			Notifications.error('Failure', err, 'Unable to push image tag');
		})
		.finally(function final() {
			$('#loadingViewSpinner').hide();
		});
	};

	$scope.pullTag = function(tag) {
		$('#loadingViewSpinner').show();

		ImageService.pullTag(tag)
		.then(function success(data) {
			Notifications.success('Image successfully pulled', tag);
		})
		.catch(function error(err){
			Notifications.error('Failure', err, 'Unable to pull image');
		})
		.finally(function final() {
			$('#loadingViewSpinner').hide();
		});
	};

	$scope.removeTag = function(id) {
		$('#loadingViewSpinner').show();
		ImageService.deleteImage(id, false)
		.then(function success() {
			if ($scope.image.RepoTags.length === 1) {
				Notifications.success('Image successfully deleted', id);
				$state.go('images', {}, {reload: true});
			} else {
				Notifications.success('Tag successfully deleted', id);
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
