import { Terminal } from 'xterm';

angular.module('portainer.docker')
.controller('ContainerConsoleController', ['$scope', '$transition$', 'AttachService', 'ContainerService', 'ImageService', 'EndpointProvider', 'Notifications', 'ContainerHelper', 'ExecService', 'HttpRequestHelper', 'LocalStorage', 'CONSOLE_COMMANDS_LABEL_PREFIX',
function ($scope, $transition$, AttachService, ContainerService, ImageService, EndpointProvider, Notifications, ContainerHelper, ExecService, HttpRequestHelper, LocalStorage, CONSOLE_COMMANDS_LABEL_PREFIX) {
  var socket, term;

  let states = Object.freeze({
    "unloaded": 0,
    "disconnected": 1,
    "connecting": 2,
    "connected": 3,
  });

  let modes = Object.freeze({
    "none": 0,
    "exec": 1,
    "attach": 2
  });

  $scope.states = states;
  $scope.modes = modes;

  $scope.state = states.loaded;
  $scope.mode = modes.none;

  $scope.formValues = {};
  $scope.containerCommands = [];

  // Ensure the socket is closed before leaving the view
  $scope.$on('$stateChangeStart', function () {
    $scope.disconnect();
  });

  $scope.connectAttach = function() {
    if ($scope.state > states.disconnected) {
      return;
    }

    $scope.mode = modes.attach;
    $scope.state = states.connecting;

    var termWidth = Math.floor(($('#terminal-container').width() - 20) / 8.39);
    var termHeight = 30;

    var attachId = $transition$.params().id;

    ContainerService.container(attachId).then((details)=> {

      if (!details.State.Running) {
        Notifications.error("Failure", details, "Container " + attachId + " is not running!");
        $scope.disconnect();
        return;
      }

      const params = {
        token: LocalStorage.getJWT(),
        endpointId: EndpointProvider.endpointID(),
        id: attachId
      };

      var url = window.location.href.split('#')[0] + 'api/websocket/attach?' + (Object.keys(params).map((k) => k + "=" + params[k]).join("&"));

      if ($transition$.params().nodeName) {
        url += '&nodeName=' + $transition$.params().nodeName;
      }
      if (url.indexOf('https') > -1) {
        url = url.replace('https://', 'wss://');
      } else {
        url = url.replace('http://', 'ws://');
      }
      initTerm(url, termHeight, termWidth);
      return AttachService.resizeTTY(attachId, termHeight, termWidth, 2000);
    })
    .catch(function error(err) {
        Notifications.error('Error', err, 'Unable to retrieve container details');
        $scope.disconnect();
    });
  };

  $scope.connectExec = function() {
    if ($scope.state > states.disconnected) {
      return;
    }

    $scope.mode = modes.exec;
    $scope.state = states.connecting;
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

    ContainerService.createExec(execConfig)
    .then(function success(data) {

      const params = {
        token: LocalStorage.getJWT(),
        endpointId: EndpointProvider.endpointID(),
        id: data.Id
      };

      var url = window.location.href.split('#')[0] + 'api/websocket/exec?' + (Object.keys(params).map((k) => k + "=" + params[k]).join("&"));

      if ($transition$.params().nodeName) {
        url += '&nodeName=' + $transition$.params().nodeName;
      }
      if (url.indexOf('https') > -1) {
        url = url.replace('https://', 'wss://');
      } else {
        url = url.replace('http://', 'ws://');
      }
      initTerm(url, termHeight, termWidth);
      return ExecService.resizeTTY(params.id, termHeight, termWidth, 2000);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to exec into container');
      $scope.disconnect();
    });
  };

  $scope.disconnect = function() {
    if (socket) {
      socket.close();
    }
    if ($scope.state > states.disconnected) {
      $scope.state = states.disconnected;
      $scope.mode = modes.none;
      if (term) {
        term.write("\n\r(connection closed)");
        term.dispose();
      }
    }
  };

  function initTerm(url, height, width) {
    socket = new WebSocket(url);

    socket.onopen = function() {
      $scope.state = states.connected;
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
      socket.onerror = function (err) {
        $scope.disconnect();
        Notifications.error("Failure",err, "Connection error");
      };
      socket.onclose = function() {
        $scope.disconnect();
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
      var containerLabels = $scope.container.Config.Labels;
      $scope.imageOS = image.Os;
      $scope.formValues.command = image.Os === 'windows' ? 'powershell' : 'bash';
      $scope.containerCommands = Object.keys(containerLabels)
        .filter(function(label) {
          return label.indexOf(CONSOLE_COMMANDS_LABEL_PREFIX) === 0;
        })
        .map(function(label) {
          return {title: label.replace(CONSOLE_COMMANDS_LABEL_PREFIX, ''), command: containerLabels[label]};
        });
      $scope.state = states.disconnected;
    })
    .catch(function error(err) {
      Notifications.error('Error', err, 'Unable to retrieve container details');
    });
  }

  initView();
}]);
