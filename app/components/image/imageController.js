angular.module('image', [])
.controller('ImageController', ['$scope', '$q', '$routeParams', '$location', 'Image', 'Container', 'Messages', 'LineChart',
function($scope, $q, $routeParams, $location, Image, Container, Messages, LineChart) {
    $scope.history = [];
    $scope.tag = {repo: '', force: false};

    $scope.remove = function() {
        Image.remove({id: $routeParams.id}, function(d) {
            Messages.send("Image Removed", $routeParams.id);
        }, function(e) {
            $scope.error = e.data;
            $('#error-message').show();
        });
    };

    $scope.getHistory = function() {
        Image.history({id: $routeParams.id}, function(d) {
            $scope.history = d;
        });
    };

    $scope.updateTag = function() {
        var tag = $scope.tag;
        Image.tag({id: $routeParams.id, repo: tag.repo, force: tag.force ? 1 : 0}, function(d) {
            Messages.send("Tag Added", $routeParams.id);
        }, function(e) {
            $scope.error = e.data;
            $('#error-message').show();
        });
    };

    function getContainersFromImage($q, Container, tag) {
        var defer = $q.defer();
        
        Container.query({all:1, notruc:1}, function(d) {
            var containers = [];
            for (var i = 0; i < d.length; i++) {
                var c = d[i];
                if (c.Image === tag) {
                    containers.push(new ContainerViewModel(c));
                }
            }
            defer.resolve(containers);
        });

        return defer.promise;
    }

    Image.get({id: $routeParams.id}, function(d) {
        $scope.image = d;
        $scope.tag = d.id;
        var t = $routeParams.tag;
        if (t && t !== ":") {
            $scope.tag = t;
            var promise = getContainersFromImage($q, Container, t);

            promise.then(function(containers) {
                LineChart.build('#containers-started-chart', containers, function(c) { return new Date(c.Created * 1000).toLocaleDateString(); });
            });
        }
    }, function(e) {
        if (e.status === 404) {
            $('.detail').hide();
            $scope.error = "Image not found.<br />" + $routeParams.id;
        } else {
            $scope.error = e.data;
        }
        $('#error-message').show();
    });

    $scope.getHistory();
}]);
