angular.module('pullImage', [])
    .controller('PullImageController', ['$scope', '$log', 'Dockerfile', 'Messages', 'Image', 'ViewSpinner',
        function($scope, $log, Dockerfile, Messages, Image, ViewSpinne) {
            $scope.template = 'app/components/pullImage/pullImage.html';

            $scope.config = {
                registry: '',
                repo: '',
                fromImage: '',
                tag: 'latest'
            }

            function failedRequestHandler(e, Messages) {
                Messages.error('Error', errorMsgFilter(e));
            }

            $scope.pull = function() {
                $('#error-message').hide();
                var config = angular.copy($scope.config);
                var imageName = (config.registry ? config.registry + '/' : '' ) +
                    (config.repo ? config.repo + '/' : '') +
                    (config.fromImage) +
                    (config.tag ? ':' + config.tag : '');

                ViewSpinner.spin();
                Image.create(config, function(data) {
                    ViewSpinner.stop();
                    if (data.constructor === Array) {
                        var f = data.length > 0 && data[data.length-1].hasOwnProperty('error');
                        //check for error
                        if (f) {
                            var d = data[data.length - 1];
                            $scope.error = "Cannot pull image " + imageName + " Reason: " + d.error;
                            $('#error-message').show();
                        } else {
                            Messages.send("Image Added", imageName);
                            $('#pull-modal').modal('hide');
                        }
                    } else {
                        Messages.send("Image Added", imageName);
                        $('#pull-modal').modal('hide');
                    }
                }, function(e) {
                    ViewSpinner.stop();
                    $scope.error = "Cannot pull image " + imageName + " Reason: " + e.data;
                    $('#error-message').show();
                });
            }
        }]);
