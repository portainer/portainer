import { baseHref } from '@/portainer/helpers/pathHelper';
import { commandStringToArray } from '@/docker/helpers/containers';
import { isLinuxTerminalCommand, LINUX_SHELL_INIT_COMMANDS } from '@@/Terminal/Terminal';

angular.module('portainer.docker').controller('ContainerConsoleController', [
  '$scope',
  '$state',
  '$transition$',
  'ContainerService',
  'ExecService',
  'ImageService',
  'Notifications',
  'HttpRequestHelper',
  'CONSOLE_COMMANDS_LABEL_PREFIX',
  'endpoint',
  function ($scope, $state, $transition$, ContainerService, ExecService, ImageService, Notifications, HttpRequestHelper, CONSOLE_COMMANDS_LABEL_PREFIX, endpoint) {
    const states = Object.freeze({
      disconnected: 0,
      connecting: 1,
      connected: 2,
    });

    $scope.loaded = false;
    $scope.states = states;
    $scope.state = states.disconnected;
    $scope.formValues = {};
    $scope.containerCommands = [];

    $scope.shellUrl = '';
    $scope.shellConnect = false;
    $scope.onShellResize = null;
    $scope.shellInitCommands = null;

    $scope.$on('$destroy', function () {
      $scope.disconnect();
    });

    $scope.onShellStateChange = function (state) {
      $scope.$evalAsync(function () {
        if (state === 'connected') {
          $scope.state = states.connected;
        } else if (state === 'disconnected') {
          $scope.state = states.disconnected;
          $scope.shellConnect = false;
        }
      });
    };

    $scope.connectAttach = function () {
      if ($scope.state > states.disconnected) {
        return;
      }

      $scope.state = states.connecting;

      const attachId = $transition$.params().id;

      ContainerService.container(endpoint.Id, attachId)
        .then((details) => {
          if (!details.State.Running) {
            Notifications.error('Failure', details, 'Container ' + attachId + ' is not running!');
            $scope.disconnect();
            return;
          }

          $scope.onShellResize = function ({ rows, cols }) {
            ContainerService.resizeTTY(endpoint.Id, attachId, cols, rows);
          };
          $scope.shellUrl = buildShellUrl('api/websocket/attach', { endpointId: $state.params.endpointId, id: attachId });
          $scope.shellConnect = true;
        })
        .catch(function (err) {
          Notifications.error('Error', err, 'Unable to retrieve container details');
          $scope.disconnect();
        });
    };

    $scope.connectExec = function () {
      if ($scope.state > states.disconnected) {
        return;
      }

      $scope.state = states.connecting;

      const command = $scope.formValues.isCustomCommand ? $scope.formValues.customCommand : $scope.formValues.command;
      const execConfig = {
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        User: $scope.formValues.user,
        Cmd: commandStringToArray(command),
      };

      ContainerService.createExec(endpoint.Id, $transition$.params().id, execConfig)
        .then(function (data) {
          $scope.onShellResize = function ({ rows, cols }) {
            ExecService.resizeTTY(data.Id, cols, rows);
          };
          if (isLinuxTerminalCommand(execConfig.Cmd[0])) {
            $scope.shellInitCommands = LINUX_SHELL_INIT_COMMANDS;
          }
          $scope.shellUrl = buildShellUrl('api/websocket/exec', { endpointId: $state.params.endpointId, id: data.Id });
          $scope.shellConnect = true;
        })
        .catch(function (err) {
          Notifications.error('Failure', err, 'Unable to exec into container');
          $scope.disconnect();
        });
    };

    $scope.disconnect = function () {
      $scope.shellConnect = false;
      $scope.state = states.disconnected;
      $scope.onShellResize = null;
      $scope.shellInitCommands = null;
    };

    $scope.autoconnectAttachView = function () {
      return $scope.initView().then(function () {
        if ($scope.container.State.Running) {
          $scope.connectAttach();
        }
      });
    };

    $scope.initView = function () {
      HttpRequestHelper.setPortainerAgentTargetHeader($transition$.params().nodeName);
      return ContainerService.container(endpoint.Id, $transition$.params().id)
        .then(function (data) {
          $scope.container = data;
          return ImageService.image(data.Image);
        })
        .then(function (data) {
          const containerLabels = $scope.container.Config.Labels;
          $scope.imageOS = data.Os;
          $scope.formValues.command = data.Os === 'windows' ? 'powershell' : 'bash';
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
        .catch(function (err) {
          Notifications.error('Error', err, 'Unable to retrieve container details');
        });
    };

    $scope.handleIsCustomCommandChange = function (enabled) {
      $scope.$evalAsync(() => {
        $scope.formValues.isCustomCommand = enabled;
      });
    };

    function buildShellUrl(path, params) {
      const base = window.location.origin.startsWith('http') ? `${window.location.origin}${baseHref()}` : baseHref();
      let url =
        base +
        path +
        '?' +
        Object.keys(params)
          .map((k) => k + '=' + params[k])
          .join('&');
      if ($transition$.params().nodeName) {
        url += '&nodeName=' + $transition$.params().nodeName;
      }
      return url.startsWith('https') ? url.replace('https://', 'wss://') : url.replace('http://', 'ws://');
    }
  },
]);
