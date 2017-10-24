angular.module('containerLogs', [])
.controller('ContainerLogsController', ['$scope', '$transition$', '$anchorScroll', 'ContainerLogs', 'Container', 'Notifications',
function ($scope, $transition$, $anchorScroll, ContainerLogs, Container, Notifications) {
  $scope.state = {};
  $scope.state.displayTimestampsOut = false;
  $scope.state.displayTimestampsErr = false;
  $scope.state.both = false;
  $scope.state.StdOut = { data: '', last: '0', chunk: 0, scrollback: 1000, page: 2000 };
  $scope.state.StdErr = { data: '', last: '0', chunk: 0, scrollback: 1000, page: 2000 };
  $scope.termStdOut = 'empty';
  $scope.termStdErr = 'empty';

  Container.get({id: $transition$.params().id}, function (d) {
    $scope.container = d;
  }, function (e) {
    Notifications.error('Failure', e, 'Unable to retrieve container info');
  });

  function updateLogs() { updateLogStd('Out'); if ( $scope.state.both === true ) { updateLogStd('Err'); } else { ErrDestroy(); } }

  function ErrDestroy() { if ( $scope.termStdErr !== 'empty' ) {
    $scope.termStdErr.destroy();
    $scope.termStdErr = 'empty';
  }}

  function getLogsStd (std, since, f) {
    var n = [1 , ($scope.state.both) ? 1 : 0 ];
    if ( (std === 'Err') && !$scope.state.both) { n = [ 0, 1]; }
    ContainerLogs.get($transition$.params().id, {
      stdout: n[0],
      stderr: n[1],
      timestamps: true,
      tail: 'all',
      since: $scope.state['Std'+std].last
    }, f );
  }

  function truncateLogPage (std) {
    var data = $scope.state['Std'+std].data;
    d = data.split('\n');
    var l = $scope.state['Std'+std].page;
    if (d.length > l) { d = d.slice(d.length-l); }
    $scope.state['Std'+std].data = d.join('\n');
  }

  function updateLogStd (std) {
    if ( $scope['termStd'+std] === 'empty' ) { $scope['termStd'+std] = NewTerm('std'+std+'-terminal'); }
    getLogsStd(std, $scope.state['Std'+std].last, function (data, status, headers, config) {
      var stdvar = $scope.state['Std'+std];
      stdvar.data += data;
      var d = data.split('\n');
      if (d.length>1) {
        stdvar.chunk += d.length;
        // To get full timestamp substring(0,30)
        stdvar.last = new Date(d[d.length-2].substring(0,30)).getTime(); // RFC to UNIX Timestamp
        logView(std,data);
      }
      $scope.state['Std'+std] = stdvar;
      truncateLogPage(std);
    });
  }

  function logView(std, data) {
    var d = data.split('\n');
    var l = $scope.state['Std'+std].scrollback;
    if (d.length > l) { d = d.slice(d.length-l); }
    for (var i = 0 ; i < d.length ; i++ ) {
      // Custom data format and output to terminal YYYYMMDD-HH:MM:SS
      d[i] = (($scope.state['displayTimestamps'+std]) ?
       (d[i].substring(0, 4) + d[i].substring(5, 7) + d[i].substring(8, 10) + '-' + d[i].substring(11, 19)) : '' )
       + d[i].substring(30);
    }
    // Join and write to terminal
    $scope['termStd'+std].write(d.join('\n'));
  }

  function displayTimeLogStd (std) {
    $scope['termStd'+std].clear();
    logView(std, $scope.state['Std'+std].data);
  }

  function readLogsStd(std) {
    return encodeURIComponent($scope.state['Std'+std].data.split('\n'));
  }

  $scope.$on('$destroy', function () {
    clearInterval(logIntervalId); // clearing interval when view changes
    $scope.termStdOut.destroy();
    ErrDestroy();
  });

  var NewTerm = function(id) {
    var term = new Terminal();
    term.open(document.getElementById(id), true);
    term.fit();
    return term;
  };

  $scope.readLogsStd = readLogsStd;
  $scope.displayTimeLogStd = displayTimeLogStd;
  $scope.$watchGroup(['state.both','state.StdOut.scrollback','state.StdOut.page','state.StdErr.scrollback','state.StdErr.page'],function () {
    $.each( { 'Out':'', 'Err':'' } , function (std) {
      if ( $scope['termStd'+std] !== 'empty' ) {
        $scope.state['Std'+std].last = 0;
        $scope.state['Std'+std].chunk = 0;
        $scope.state['Std'+std].data = '';
        $scope['termStd'+std].clear();
      }
    });
    updateLogs();
  });

  window.setTimeout(updateLogs,200); // initial call
  var logIntervalId = window.setInterval(updateLogs, 5000);

}]);
