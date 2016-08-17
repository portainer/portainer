angular.module('containerConsole', [])
.controller('ContainerConsoleController', ['$scope', '$stateParams', 'Settings', 'Container', 'Exec', '$timeout', 'Messages', 'errorMsgFilter',
function ($scope, $stateParams, Settings, Container, Exec, $timeout, Messages, errorMsgFilter) {
  $scope.state = {};
  $scope.state.command = "bash";
  $scope.connected = false;

  var socket, term;

  // Ensure the socket is closed before leaving the view
  $scope.$on('$stateChangeStart', function (event, next, current) {
    if (socket !== null) {
      socket.close();
    }
  });

  Container.get({id: $stateParams.id}, function(d) {
    $scope.container = d;
    $('#loadingViewSpinner').hide();
  });

  $scope.connect = function() {
    $('#loadConsoleSpinner').show();
    var termWidth = Math.round($('#terminal-container').width() / 8.2);
    var termHeight = 30;
    var execConfig = {
      id: $stateParams.id,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      Cmd: $scope.state.command.replace(" ", ",").split(",")
    };

    Container.exec(execConfig, function(d) {
      if (d.Id) {
        var execId = d.Id;
        resizeTTY(execId, termHeight, termWidth);
        var url = window.location.href.split('#')[0] + 'ws/exec?id=' + execId;
        if (url.indexOf('https') > -1) {
          url = url.replace('https://', 'wss://');
        } else {
          url = url.replace('http://', 'ws://');
        }
        initTerm(url, termHeight, termWidth);
      } else {
        $('#loadConsoleSpinner').hide();
        Messages.error('Error', errorMsgFilter(d));
      }
    }, function (e) {
      $('#loadConsoleSpinner').hide();
      Messages.error("Failure", e.data);
    });
  };

  $scope.disconnect = function() {
    $scope.connected = false;
    if (socket !== null) {
      socket.close();
    }
    if (term !== null) {
      term.destroy();
    }
  };

  function resizeTTY(execId, height, width) {
    $timeout(function() {
      Exec.resize({id: execId, height: height, width: width}, function (d) {
        var error = errorMsgFilter(d);
        if (error) {
          Messages.error('Error', 'Unable to resize TTY');
        }
      });
    }, 2000);

  }

  function initTerm(url, height, width) {
    socket = new WebSocket(url);

    $scope.connected = true;
    socket.onopen = function(evt) {
      $('#loadConsoleSpinner').hide();
      term = new Terminal({
        cols: width,
        rows: height,
        cursorBlink: true
      });

      term.on('data', function (data) {
        socket.send(data);
      });
      term.open(document.getElementById('terminal-container'));

      socket.onmessage = function (e) {
        term.write(e.data);
      };
      socket.onerror = function (error) {
        $scope.connected = false;

      };
      socket.onclose = function(evt) {
        $scope.connected = false;
        // term.write("Session terminated");
        // term.destroy();
      };
    };
  }
}]);
