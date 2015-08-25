angular.module('stats', [])
    .controller('StatsController', ['Settings', '$scope', 'Messages', '$timeout', 'Container', 'LineChart', '$routeParams', function (Settings, $scope, Messages, $timeout, Container, LineChart, $routeParams) {
        var sessionKey = 'dockeruiStats-' + $routeParams.id;
        var localData = sessionStorage.getItem(sessionKey);
        if (localData) {
            $scope.dockerStats = localData;
        } else {
            $scope.dockerStats = [];
        }


        function updateStats() {
            Container.stats({id: $routeParams.id}, function (d) {
                console.log(d);
                var arr = Object.keys(d).map(function (key) {
                    return d[key];
                });
                if (arr.join('').indexOf('no such id') !== -1) {
                    Messages.error('Unable to retrieve container stats', 'Has this container been removed?');
                    return;
                }
                $scope.dockerStats.push(d);
                sessionStorage.setItem(sessionKey, $scope.dockerStats);
                $timeout(updateStats, 1000);
                // Update graph with latest data
                updateChart($scope.dockerStats);
            }, function () {
                Messages.error('Unable to retrieve container stats', 'Has this container been removed?');
            });
        }

        updateStats();

        $scope.calculateCPUPercent = function (stats) {
            // Same algorithm the official client uses: https://github.com/docker/docker/blob/master/api/client/stats.go#L195-L208
            var prevCpu = stats.precpu_stats;
            var curCpu = stats.cpu_stats;

            var cpuPercent = 0.0;

            // calculate the change for the cpu usage of the container in between readings
            var cpuDelta = curCpu.cpu_usage.total_usage - prevCpu.cpu_usage.total_usage;
            // calculate the change for the entire system between readings
            var systemDelta = curCpu.system_cpu_usage - prevCpu.system_cpu_usage;

            if (systemDelta > 0.0 && cpuDelta > 0.0) {
                cpuPercent = (cpuDelta / systemDelta) * curCpu.cpu_usage.percpu_usage.size() * 100.0;
            }
            return cpuPercent
        };

        function updateChart(data) {
            // TODO: Build data in the right format and create chart.
            //LineChart.build('#cpu-stats-chart', $scope.dockerStats, function (d) {
            //    return $scope.calculateCPUPercent(d)
            //});
        }
    }]);