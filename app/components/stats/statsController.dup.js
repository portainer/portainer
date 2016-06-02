angular.module('stats', [])
    .controller('StatsController', ['Settings', '$scope', 'Messages', '$timeout', 'Container', '$routeParams', 'humansizeFilter', '$sce', function (Settings, $scope, Messages, $timeout, Container, $routeParams, humansizeFilter, $sce) {
        // TODO: Force scale to 0-100 for cpu, fix charts on dashboard,
        // TODO: Force memory scale to 0 - max memory

        var cpuLabels = [];
        var cpuData = [];
        var memoryLabels = [];
        var memoryData = [];
        var networkLabels = [];
        var networkTxData = [];
        var networkRxData = [];
        for (var i = 0; i < 20; i++) {
            cpuLabels.push('');
            cpuData.push(0);
            memoryLabels.push('');
            memoryData.push(0);
            networkLabels.push('');
            networkTxData.push(0);
            networkRxData.push(0);
        }
        var cpuDataset = { // CPU Usage
            fillColor: "rgba(151,187,205,0.5)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            data: cpuData
        };
        var memoryDataset = {
            fillColor: "rgba(151,187,205,0.5)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            data: memoryData
        };
        var networkRxDataset = {
            label: "Rx Bytes",
            fillColor: "rgba(151,187,205,0.5)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            data: networkRxData
        };
        var networkTxDataset = {
            label: "Tx Bytes",
            fillColor: "rgba(255,180,174,0.5)",
            strokeColor: "rgba(255,180,174,1)",
            pointColor: "rgba(255,180,174,1)",
            pointStrokeColor: "#fff",
            data: networkTxData
        };
        var networkLegendData = [
            {
                //value: '',
                color: 'rgba(151,187,205,0.5)',
                title: 'Rx Data'
            },
            {
                //value: '',
                color: 'rgba(255,180,174,0.5)',
                title: 'Rx Data'
            }];
        legend($('#network-legend').get(0), networkLegendData);

        Chart.defaults.global.animationSteps = 30; // Lower from 60 to ease CPU load.
        var cpuChart = new Chart($('#cpu-stats-chart').get(0).getContext("2d")).Line({
            labels: cpuLabels,
            datasets: [cpuDataset]
        }, {
            responsive: true
        });

        var memoryChart = new Chart($('#memory-stats-chart').get(0).getContext('2d')).Line({
                labels: memoryLabels,
                datasets: [memoryDataset]
            },
            {
                scaleLabel: function (valueObj) {
                    return humansizeFilter(parseInt(valueObj.value, 10));
                },
                responsive: true
                //scaleOverride: true,
                //scaleSteps: 10,
                //scaleStepWidth: Math.ceil(initialStats.memory_stats.limit / 10),
                //scaleStartValue: 0
            });
        var networkChart = new Chart($('#network-stats-chart').get(0).getContext("2d")).Line({
            labels: networkLabels,
            datasets: [networkRxDataset, networkTxDataset]
        }, {
            scaleLabel: function (valueObj) {
                return humansizeFilter(parseInt(valueObj.value, 10));
            },
            responsive: true
        });
        $scope.networkLegend = $sce.trustAsHtml(networkChart.generateLegend());

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
                $scope.data = d;
                updateCpuChart(d);
                updateMemoryChart(d);
                updateNetworkChart(d);
                timeout = $timeout(updateStats, 5000);
            }, function () {
                Messages.error('Unable to retrieve stats', 'Is this container running?');
                timeout = $timeout(updateStats, 5000);
            });
        }

        var timeout;
        $scope.$on('$destroy', function () {
            $timeout.cancel(timeout);
        });

        updateStats();

        function updateCpuChart(data) {
            cpuChart.addData([calculateCPUPercent(data)], new Date(data.read).toLocaleTimeString());
            cpuChart.removeData();
        }

        function updateMemoryChart(data) {
            memoryChart.addData([data.memory_stats.usage], new Date(data.read).toLocaleTimeString());
            memoryChart.removeData();
        }

        var lastRxBytes = 0, lastTxBytes = 0;

        function updateNetworkChart(data) {
            // 1.9+ contains an object of networks, for now we'll just show stats for the first network
            // TODO: Show graphs for all networks
            if (data.networks) {
                $scope.networkName = Object.keys(data.networks)[0];
                data.network = data.networks[$scope.networkName];
            }
            var rxBytes = 0, txBytes = 0;
            if (lastRxBytes !== 0 || lastTxBytes !== 0) {
                // These will be zero on first call, ignore to prevent large graph spike
                rxBytes = data.network.rx_bytes - lastRxBytes;
                txBytes = data.network.tx_bytes - lastTxBytes;
            }
            lastRxBytes = data.network.rx_bytes;
            lastTxBytes = data.network.tx_bytes;
            networkChart.addData([rxBytes, txBytes], new Date(data.read).toLocaleTimeString());
            networkChart.removeData();
        }

        function calculateCPUPercent(stats) {
            // Same algorithm the official client uses: https://github.com/docker/docker/blob/master/api/client/stats.go#L195-L208
            var prevCpu = stats.precpu_stats;
            var curCpu = stats.cpu_stats;

            var cpuPercent = 0.0;

            // calculate the change for the cpu usage of the container in between readings
            var cpuDelta = curCpu.cpu_usage.total_usage - prevCpu.cpu_usage.total_usage;
            // calculate the change for the entire system between readings
            var systemDelta = curCpu.system_cpu_usage - prevCpu.system_cpu_usage;

            if (systemDelta > 0.0 && cpuDelta > 0.0) {
                cpuPercent = (cpuDelta / systemDelta) * curCpu.cpu_usage.percpu_usage.length * 100.0;
            }
            return cpuPercent;
        }

        Container.get({id: $routeParams.id}, function (d) {
            $scope.containerName = d.Name.substring(1);
        }, function (e) {
            Messages.error("Failure", e.data);
        });
    }])
;