angular.module('stats', [])
    .controller('StatsController', ['Settings', '$scope', 'Messages', '$timeout', 'Container', '$routeParams', function (Settings, $scope, Messages, $timeout, Container, $routeParams) {
        // TODO: Implement memory chart, force scale to 0-100 for cpu, 0 to limit for memory, fix charts on dashboard

        var labels = [];
        var data = [];
        for (var i = 0; i < 40; i ++) {
            labels.push('');
            data.push(0);
        }
        var dataset = { // CPU Usage
            fillColor: "rgba(151,187,205,0.5)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            data: data
        };

        var chart = new Chart($('#cpu-stats-chart').get(0).getContext("2d")).Line({
                labels: labels,
                datasets: [dataset]
            });


        function updateStats() {
            Container.stats({id: $routeParams.id}, function (d) {
                var arr = Object.keys(d).map(function (key) {
                    return d[key];
                });
                if (arr.join('').indexOf('no such id') !== -1) {
                    Messages.error('Unable to retrieve stats', 'Is this container running?');
                    return;
                }

                // Update graph with latest data
                updateChart(d);
                $timeout(updateStats, 1000); // TODO: Switch to setInterval for more consistent readings
            }, function () {
                Messages.error('Unable to retrieve stats', 'Is this container running?');
            });
        }

        updateStats();

        function updateChart(data) {
            console.log('updateChart', data);
            chart.addData([$scope.calculateCPUPercent(data)], new Date(data.read).toLocaleTimeString());
            chart.removeData();
        }

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
                //console.log('size thing:', curCpu.cpu_usage.percpu_usage);
                cpuPercent = (cpuDelta / systemDelta) * curCpu.cpu_usage.percpu_usage.length * 100.0;
            }
            return Math.random() * 100;
            //return cpuPercent; TODO: Switch back to the real value
        };
    }]);