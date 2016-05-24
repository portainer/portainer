angular.module('dashboard', [])
    .controller('DashboardController', ['$scope', 'Container', 'Image', 'Settings', 'LineChart', function ($scope, Container, Image, Settings, LineChart) {
        $scope.predicate = '-Created';
        $scope.containers = [];

        var getStarted = function (data) {
            $scope.totalContainers = data.length;
            LineChart.build('#containers-started-chart', data, function (c) {
                return new Date(c.Created * 1000).toLocaleDateString();
            });
            var s = $scope;
            Image.query({}, function (d) {
                s.totalImages = d.length;
                LineChart.build('#images-created-chart', d, function (c) {
                    return new Date(c.Created * 1000).toLocaleDateString();
                });
            });
        };

        var opts = {animation: false};
        if (Settings.firstLoad) {
            opts.animation = true;
            Settings.firstLoad = false;
            localStorage.setItem('firstLoad', false);
            $('#masthead').show();

            setTimeout(function () {
                $('#masthead').slideUp('slow');
            }, 5000);
        }

        Container.query({all: 1}, function (d) {
            var running = 0;
            var ghost = 0;
            var stopped = 0;

            var containers = d.filter(function (container) {
              return container.Image !== 'swarm';
            });
            for (var i = 0; i < containers.length; i++) {
                var item = containers[i];

                if (item.Status === "Ghost") {
                    ghost += 1;
                } else if (item.Status.indexOf('Exit') !== -1) {
                    stopped += 1;
                } else {
                    running += 1;
                    $scope.containers.push(new ContainerViewModel(item));
                }
            }

            getStarted(containers);

            var c = new Chart($('#containers-chart').get(0).getContext("2d"));
            var data = [
                {
                    value: running,
                    color: '#5bb75b',
                    title: 'Running'
                }, // running
                {
                    value: stopped,
                    color: '#C7604C',
                    title: 'Stopped'
                }, // stopped
                {
                    value: ghost,
                    color: '#E2EAE9',
                    title: 'Ghost'
                } // ghost
            ];

            c.Doughnut(data, opts);
            var lgd = $('#chart-legend').get(0);
            legend(lgd, data);
        });
    }]);
