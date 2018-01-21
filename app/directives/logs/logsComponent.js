angular.module('portainer.components').component('logsView', {
    templateUrl: 'app/directives/logs/template.html',
    bindings: {
        id: '<',
        type: '<',
        isLoading: '&'
    },
    controller: ['$interval', '$q', 'LogsService', function ($interval, $q, LogsService) {
        var ctrl = this;
        ctrl.state = {};
        ctrl.state.displayTimestampsOut = false;
        ctrl.state.displayTimestampsErr = false;
        ctrl.stdout = '';
        ctrl.stderr = '';

        var fetchLogsInterval;

        var logService = LogsService[ctrl.type];

        function getLogs() {
          if (ctrl.id) {
            ctrl.isLoading = true;

            $q.all([
              getLogsStdout(),
              getLogsStderr()
            ]).then(function() {
                ctrl.isLoading = false;
            });
          }
        }

        function getLogsStderr() {
          return logService.getStdErr(ctrl.id, {
            timestamps: ctrl.state.displayTimestampsErr
           }).then(function(data) {
            ctrl.stderr = data;
          });
        }

        function getLogsStdout() {
          return logService.getStdOut(ctrl.id, {
            timestamps: ctrl.state.displayTimestampsOut
          }).then(function(data) {
            ctrl.stdout = data;
          });
        }

        function initView() {
          getLogs();
          fetchLogsInterval = $interval(getLogs, 5000);

          ctrl.$onDestroy = function () {
            $interval.cancel(fetchLogsInterval);
          };

          ctrl.toggleTimestampsOut = getLogsStdout;
          ctrl.toggleTimestampsErr = getLogsStderr;
        }

        initView();
    }]
});
