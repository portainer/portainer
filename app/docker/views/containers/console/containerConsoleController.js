angular.module('portainer.docker')
.controller('ContainerConsoleController', ['$scope', '$transition$', 'ContainerService', 'ImageService', 'EndpointProvider', 'Notifications', 'ContainerHelper', 'ExecService', 'HttpRequestHelper', 'LocalStorage',
function ($scope, $transition$, ContainerService, ImageService, EndpointProvider, Notifications, ContainerHelper, ExecService, HttpRequestHelper, LocalStorage) {
  var socket, term;

  $scope.state = {
    loaded: false,
    connected: false
  };

  $scope.formValues = {};

  // Ensure the socket is closed before leaving the view
  $scope.$on('$stateChangeStart', function (event, next, current) {
    if (socket && socket !== null) {
      socket.close();
    }
  });

  $scope.connect = function() {
    var termWidth = Math.floor(($('#terminal-container').width() - 20) / 8.39);
    var termHeight = 30;
    var command = $scope.formValues.isCustomCommand ?
                    $scope.formValues.customCommand : $scope.formValues.command;
    var execConfig = {
      id: $transition$.params().id,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      User: $scope.formValues.user,
      Cmd: ContainerHelper.commandStringToArray(command)
    };

    var execId;
    ContainerService.createExec(execConfig)
    .then(function success(data) {
      execId = data.Id;
      var jwtToken = LocalStorage.getJWT();
      var url = window.location.href.split('#')[0] + 'api/websocket/exec?id=' + execId + '&endpointId=' + EndpointProvider.endpointID() + '&token=' + jwtToken;
      if ($transition$.params().nodeName) {
        url += '&nodeName=' + $transition$.params().nodeName;
      }
      if (url.indexOf('https') > -1) {
        url = url.replace('https://', 'wss://');
      } else {
        url = url.replace('http://', 'ws://');
      }
      initTerm(url, termHeight, termWidth);
      return ExecService.resizeTTY(execId, termHeight, termWidth, 2000);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to exec into container');
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

  function initTerm(url, height, width) {
    socket = new WebSocket(url);

    $scope.state.connected = true;
    socket.onopen = function(evt) {
      term = new Terminal();

      term.on('data', function (data) {
        socket.send(data);
      });
      term.open(document.getElementById('terminal-container'));
      term.focus();
      term.resize(width, height);
      term.setOption('cursorBlink', true);
      term.fit();

      window.onresize = function() {
        term.fit();
      };

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

  function initView() {
    HttpRequestHelper.setPortainerAgentTargetHeader($transition$.params().nodeName);
    ContainerService.container($transition$.params().id)
    .then(function success(data) {
      var container = data;
      $scope.container = container;
      return ImageService.image(container.Image);
    })
    .then(function success(data) {
      var image = data;
      $scope.imageOS = image.Os;
      $scope.formValues.command = image.Os === 'windows' ? 'powershell' : 'bash';
      $scope.state.loaded = true;
    })
    .catch(function error(err) {
      Notifications.error('Error', err, 'Unable to retrieve container details');
    });
  }

  initView();
}]);
