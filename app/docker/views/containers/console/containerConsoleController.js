import { Terminal } from 'xterm';

angular.module('portainer.docker').controller('ContainerConsoleController', [
  '$scope',
  '$state',
  '$transition$',
  'ContainerService',
  'ImageService',
  'Notifications',
  'ContainerHelper',
  'ExecService',
  'HttpRequestHelper',
  'LocalStorage',
  'CONSOLE_COMMANDS_LABEL_PREFIX',
  function (
    $scope,
    $state,
    $transition$,
    ContainerService,
    ImageService,
    Notifications,
    ContainerHelper,
    ExecService,
    HttpRequestHelper,
    LocalStorage,
    CONSOLE_COMMANDS_LABEL_PREFIX
  ) {
    var socket, term;

    let states = Object.freeze({
      disconnected: 0,
      connecting: 1,
      connected: 2,
    });

    $scope.loaded = false;
    $scope.states = states;
    $scope.state = states.disconnected;

    $scope.formValues = {};
    $scope.containerCommands = [];

    // Ensure the socket is closed before leaving the view
    $scope.$on('$stateChangeStart', function () {
      $scope.disconnect();
    });

    $scope.connectAttach = function () {
      if ($scope.state > states.disconnected) {
        return;
      }

      $scope.state = states.connecting;

      let attachId = $transition$.params().id;

      ContainerService.container(attachId)
        .then((details) => {
          if (!details.State.Running) {
            Notifications.error('Failure', details, 'Container ' + attachId + ' is not running!');
            $scope.disconnect();
            return;
          }

          const params = {
            token: LocalStorage.getJWT(),
            endpointId: $state.params.endpointId,
            id: attachId,
          };

          var url =
            window.location.href.split('#')[0] +
            'api/websocket/attach?' +
            Object.keys(params)
              .map((k) => k + '=' + params[k])
              .join('&');

          initTerm(url, ContainerService.resizeTTY.bind(this, attachId));
        })
        .catch(function error(err) {
          Notifications.error('Error', err, 'Unable to retrieve container details');
          $scope.disconnect();
        });
    };

    $scope.connectExec = function () {
      if ($scope.state > states.disconnected) {
        return;
      }

      $scope.state = states.connecting;
      var command = $scope.formValues.isCustomCommand ? $scope.formValues.customCommand : $scope.formValues.command;
      var execConfig = {
        id: $transition$.params().id,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        User: $scope.formValues.user,
        Cmd: ContainerHelper.commandStringToArray(command),
      };

      ContainerService.createExec(execConfig)
        .then(function success(data) {
          const params = {
            token: LocalStorage.getJWT(),
            endpointId: $state.params.endpointId,
            id: data.Id,
          };

          var url =
            window.location.href.split('#')[0] +
            'api/websocket/exec?' +
            Object.keys(params)
              .map((k) => k + '=' + params[k])
              .join('&');

          initTerm(url, ExecService.resizeTTY.bind(this, params.id));
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to exec into container');
          $scope.disconnect();
        });
    };

    $scope.disconnect = function () {
      if (socket) {
        socket.close();
      }
      if ($scope.state > states.disconnected) {
        $scope.state = states.disconnected;
        if (term) {
          term.write('\n\r(connection closed)');
          term.dispose();
        }
      }
    };

    $scope.autoconnectAttachView = function () {
      return $scope.initView().then(function success() {
        if ($scope.container.State.Running) {
          $scope.connectAttach();
        }
      });
    };

    function resize(restcall, add) {
      add = add || 0;

      term.fit();
      var termWidth = term.cols;
      var termHeight = 30;
      term.resize(termWidth, termHeight);

      restcall(termWidth + add, termHeight + add, 1);
    }

    function initTerm(url, resizeRestCall) {
      let resizefun = resize.bind(this, resizeRestCall);

      if ($transition$.params().nodeName) {
        url += '&nodeName=' + $transition$.params().nodeName;
      }
      if (url.indexOf('https') > -1) {
        url = url.replace('https://', 'wss://');
      } else {
        url = url.replace('http://', 'ws://');
      }

      socket = new WebSocket(url);

      socket.onopen = function () {
        $scope.state = states.connected;
        term = new Terminal();

        term.on('data', function (data) {
          socket.send(data);
        });
        var terminal_container = document.getElementById('terminal-container');
        term.open(terminal_container);
        term.focus();
        term.setOption('cursorBlink', true);

        window.onresize = function () {
          resizefun();
          $scope.$apply();
        };

        $scope.$watch('toggle', function () {
          setTimeout(resizefun, 400);
        });

        socket.onmessage = function (e) {
          term.write(e.data);
        };
        socket.onerror = function (err) {
          $scope.disconnect();
          $scope.$apply();
          Notifications.error('Failure', err, 'Connection error');
        };
        socket.onclose = function () {
          $scope.disconnect();
          $scope.$apply();
        };

        resizefun(1);
        $scope.$apply();
      };
    }

    $scope.initView = function () {
      HttpRequestHelper.setPortainerAgentTargetHeader($transition$.params().nodeName);
      return ContainerService.container($transition$.params().id)
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
            .filter(function (label) {
              return label.indexOf(CONSOLE_COMMANDS_LABEL_PREFIX) === 0;
            })
            .map(function (label) {
              return {
                title: label.replace(CONSOLE_COMMANDS_LABEL_PREFIX, ''),
                command: containerLabels[label],
              };
            });
          $scope.loaded = true;
        })
        .catch(function error(err) {
          Notifications.error('Error', err, 'Unable to retrieve container details');
        });
    };
  },
]);
