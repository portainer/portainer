angular.module('portainer.docker')
.controller('ImportImageController', ['$scope', '$state', 'UploadService', 'Notifications', 'HttpRequestHelper',
function ($scope, $state, UploadService, Notifications, HttpRequestHelper) {

	$scope.state = {
		actionInProgress: false
	};

	$scope.formValues = {
		UploadFile: null,
		NodeName: null
	};

	$scope.uploadImage = function() {
		$scope.state.actionInProgress = true;

		var nodeName = $scope.formValues.NodeName;
		HttpRequestHelper.setPortainerAgentTargetHeader(nodeName);
		var file = $scope.formValues.UploadFile;
		UploadService.uploadImage(file)
		.then(function success(data) {
			if (data.hasError) {
				Notifications.error('An error occured during upload', { msg: 'Please check build logs output' });
			} else {
				Notifications.success('Images successfully uploaded');
			}
		})
		.catch(function error(err) {
			Notifications.error('Failure', err, 'Unable to upload image');
		})
		.finally(function final() {
			$scope.state.actionInProgress = false;
		});
	};
}]);
