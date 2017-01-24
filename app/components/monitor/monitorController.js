angular.module('monitor', [])
    .controller('MonitorController', ['$scope', '$http', '$filter', '$stateParams', '$document', 'Container',
        function ($scope, $http, $filter, $stateParams, $document, Container) {
            $scope.state = {};
            $scope.name = undefined;
            $scope.log = "";
            $scope.range = {};
            $scope.autoFrom = null;

            setToAuto();

            $('#loadingViewSpinner').show();
            Container.get({id: $stateParams.id}, function (d) {
                $scope.container = d;
                $scope.name = $filter('trimcontainername')($scope.container.Name);

                // initial call
                // startLogStream();
                pullInterval();

                $('#loadingViewSpinner').hide();
            }, function (e) {
                $('#loadingViewSpinner').hide();
                Messages.error("Failure", e, "Unable to retrieve container info");
            });

            function pullInterval() {
                if (!$scope.auto) {
                    return;
                }

                getLogs();
                getMetrics();
            }

            function setToAuto() {
                $scope.auto = true;

                var d = new Date();
                d.setMinutes(d.getMinutes() - 3);
                $scope.range.from = d;
                $scope.autoFrom = d;

                $scope.range.to = null;
            }

            $scope.resetToAuto = function () {
                setToAuto();
                alert(1);
            };

            function startLogStream() {
                var source = new EventSource('/api/monitor/logstream?name=' + $scope.name);

                $scope.logs = "";

                source.onmessage = function (e) {
                    $scope.logs = $scope.logs + e.data + "\n";
                    $scope.$apply();
                };
            }

            function getLogs() {
                var d = new Date();
                d.setHours(d.getHours() - 1);

                $http({
                    method: 'GET',
                    url: "/api/monitor/logs",
                    params: {
                        'name': $scope.name,
                        'from': d.toISOString()
                    }
                }).success(function (data, status, headers, config) {
                    $scope.logs = "";

                    angular.forEach(data.hits.hits, function (hit) {
                        $scope.logs += hit._source.message + "\n";
                    });
                });
            }

            function getMetrics() {
                var ts = $scope.autoFrom.toISOString();
                $http.get("api/monitor/stats?db=statspout&name=" + $scope.name + "&resource=cpu_usage&from=" + ts)
                    .then(function (res) {
                        if (res.data.results[0]["series"] === undefined) {
                            return;
                        }

                        angular.forEach(res.data.results[0].series[0].values, function (value) {
                            updateCpuChart(value);
                        });
                    });

                $http.get("api/monitor/stats?db=statspout&name=" + $scope.name + "&resource=mem_usage&from=" + ts)
                    .then(function (res) {
                        if (res.data.results[0]["series"] === undefined) {
                            return;
                        }

                        angular.forEach(res.data.results[0].series[0].values, function (value) {
                            updateMemChart(value);
                        });
                    });

                $http.get("api/monitor/stats?db=statspout&name=" + $scope.name + "&resource=rx_bytes,tx_bytes&from=" + ts)
                    .then(function (res) {
                        if (res.data.results[0]["series"] === undefined) {
                            return;
                        }

                        var series = res.data.results[0].series;
                        for (var i = 0; i < series[0].values.length; i++) {
                            updateNetworkChart({
                                'rx': series[0].values[i][2],
                                'tx': series[1].values[i][2],
                                'timestamp': series[0].values[i][0]
                            });
                        }
                    });
            }

            function updateCpuChart(data) {
                var timestamp = new Date(data[0]);

                if ($scope.auto && timestamp > $scope.autoFrom) {
                    $scope.autoFrom = timestamp;
                }

                $scope.cpuChart.removeData();
                $scope.cpuChart.addData([data[2]], timestamp.toLocaleTimeString());
            }

            function updateMemChart(data) {
                var timestamp = new Date(data[0]);

                if ($scope.auto && timestamp > $scope.autoFrom) {
                    $scope.autoFrom = timestamp;
                }

                $scope.memChart.removeData();
                $scope.memChart.addData([data[2]], timestamp.toLocaleTimeString());
            }

            function updateNetworkChart(data) {
                var timestamp = new Date(data.timestamp);

                if ($scope.auto && timestamp > $scope.autoFrom) {
                    $scope.autoFrom = timestamp;
                }

                $scope.networkChart.removeData();
                $scope.networkChart.addData([data.rx, data.tx], timestamp.toLocaleTimeString());
            }

            $document.ready(function () {
                // Charts configurations.
                var cpuLabels = [],
                    cpuData = [],
                    memoryLabels = [],
                    memoryData = [],
                    networkLabels = [],
                    networkRxData = [],
                    networkTxData = [];

                for (var i = 0; i < 40; i++) {
                    cpuLabels.push('');
                    cpuData.push(0);
                    networkLabels.push('');
                    memoryLabels.push('');
                    memoryData.push(0);
                    networkRxData.push(0);
                    networkTxData.push(0);
                }

                var cpuDataset = {
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
                    fillColor: "rgba(0, 0, 0, 0)",
                    strokeColor: "rgba(151,187,205,1)",
                    pointColor: "rgba(151,187,205,1)",
                    pointStrokeColor: "#fff",
                    data: networkRxData
                };

                var networkTxDataset = {
                    fillColor: "rgba(0, 0, 0, 0)",
                    strokeColor: "rgba(51,87,05,1)",
                    pointColor: "rgba(51,87,05,1)",
                    pointStrokeColor: "#fff",
                    data: networkTxData
                };

                var networkLegendData = [{
                    color: 'rgba(151,187,205,0.5)',
                    title: 'Rx Data'
                }, {
                    color: 'rgba(51,87,05,0.5)',
                    title: 'Tx Data'
                }];

                legend($('#network-legend').get(0), networkLegendData);

                Chart.defaults.global.animationSteps = 30; // Lower from 60 to ease CPU load.
                $scope.cpuChart = new Chart($('#cpu-stats-chart').get(0).getContext("2d")).Line({
                    labels: cpuLabels,
                    datasets: [cpuDataset]
                }, {
                    responsive: true,
                    animation: false
                });

                $scope.memChart = new Chart($('#memory-stats-chart').get(0).getContext("2d")).Line({
                    labels: memoryLabels,
                    datasets: [memoryDataset]
                }, {
                    responsive: true,
                    animation: false
                });

                $scope.networkChart = new Chart($('#network-chart').get(0).getContext("2d")).Line({
                    labels: networkLabels,
                    datasets: [networkRxDataset, networkTxDataset]
                }, {
                    responsive: true,
                    animation: false
                });

                // Main interval to retrieve data.
                var pullIntervalId = window.setInterval(pullInterval, 5000);

                $scope.$on("$destroy", function () {
                    // clearing interval when view changes
                    clearInterval(pullIntervalId);
                });
            });
        }
    ]);