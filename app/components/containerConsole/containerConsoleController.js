angular.module('containerConsole', [])
.controller('ContainerConsoleController', ['$scope', '$stateParams', 'Settings', 'Container', 'Image', 'Exec', '$timeout', 'Messages',
function ($scope, $stateParams, Settings, Container, Image, Exec, $timeout, Messages) {
  $scope.state = {};
  $scope.state.loaded = false;
  $scope.state.connected = false;

  var socket, term;

  // Ensure the socket is closed before leaving the view
  $scope.$on('$stateChangeStart', function (event, next, current) {
    if (socket && socket !== null) {
      socket.close();
    }
  });

  Container.get({id: $stateParams.id}, function(d) {
    $scope.container = d;
    if (d.message) {
      Messages.error("Error", d, 'Unable to retrieve container details');
      $('#loadingViewSpinner').hide();
    } else {
      Image.get({id: d.Image}, function(imgData) {
        $scope.imageOS = imgData.Os;
        $scope.state.command = imgData.Os === 'windows' ? 'powershell' : '/bin/bash';
        $scope.state.loaded = true;
        $('#loadingViewSpinner').hide();
      }, function (e) {
        Messages.error("Failure", e, 'Unable to retrieve image details');
        $('#loadingViewSpinner').hide();
      });
    }
  }, function (e) {
    Messages.error("Failure", e, 'Unable to retrieve container details');
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
      if (d.message) {
        $('#loadConsoleSpinner').hide();
        Messages.error("Error", {}, d.message);
      } else {
        var execId = d.Id;
        resizeTTY(execId, termHeight, termWidth);
        var url = window.location.href.split('#')[0] + 'api/websocket/exec?id=' + execId;
        if (url.indexOf('https') > -1) {
          url = url.replace('https://', 'wss://');
        } else {
          url = url.replace('http://', 'ws://');
        }
        initTerm(url, termHeight, termWidth);
      }
    }, function (e) {
      $('#loadConsoleSpinner').hide();
      Messages.error("Failure", e, 'Unable to start an exec instance');
    });
  };

  $scope.disconnect = function() {
    $scope.state.connected = false;
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
        if (d.message) {
          Messages.error('Error', {}, 'Unable to resize TTY');
        }
      }, function (e) {
        Messages.error("Failure", {}, 'Unable to resize TTY');
      });
    }, 2000);

  }

  function initTerm(url, height, width) {
    socket = new WebSocket(url);

    $scope.state.connected = true;
    socket.onopen = function(evt) {
      $('#loadConsoleSpinner').hide();
      term = new Terminal();

      term.on('data', function (data) {
        socket.send(data);
      });
      term.open(document.getElementById('terminal-container'));
      term.resize(width, height);
      term.setOption('cursorBlink', true);

      socket.onmessage = function (e) {
        term.write(e.data);
      };
      socket.onerror = function (error) {
        $scope.state.connected = false;
      };
      socket.onclose = function(evt) {
        $scope.state.connected = false;
      };
    };
  }
}]);
