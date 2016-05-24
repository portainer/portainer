angular.module('images', [])
    .controller('ImagesController', ['$scope', 'Image', 'ViewSpinner', 'Messages',
        function ($scope, Image, ViewSpinner, Messages) {
          $scope.state = {};
            $scope.sortType = 'Created';
            $scope.sortReverse = true;
            $scope.state.toggle = false;

            $scope.order = function(sortType) {
                $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
                $scope.sortType = sortType;
            };

            $scope.toggleSelectAll = function () {
                angular.forEach($scope.state.filteredImages, function (i) {
                    i.Checked = $scope.state.toggle;
                });
            };

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
        }]);
