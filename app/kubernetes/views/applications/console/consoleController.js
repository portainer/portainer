import angular from 'angular';
import {Terminal} from 'xterm';

class KubernetesApplicationConsoleController {
  /* @ngInject */
  constructor($async, $state, $transition$, Notifications, KubernetesApplicationService, KubernetesPodService, EndpointProvider, LocalStorage) {
    this.$async = $async;
    this.$state = $state;
    this.$transition$ = $transition$;
    this.Notifications = Notifications;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesPodService = KubernetesPodService;
    this.EndpointProvider = EndpointProvider;
    this.LocalStorage = LocalStorage;

    this.onInit = this.onInit.bind(this);
  }

  connectConsole() {
    const params = {
      token: this.LocalStorage.getJWT(),
      endpointId: this.EndpointProvider.endpointID(),
      namespace: this.application.ResourcePool,
      podName: this.podName,
      containerName: this.application.Pods[0].Containers[0].name,
      command: this.state.command
    };

    // url builder
    var url = window.location.href.split('#')[0] + 'api/websocket/pod?' + (Object.keys(params).map((k) => k + "=" + params[k]).join("&"));
    if (url.indexOf('https') > -1) {
      url = url.replace('https://', 'wss://');
    } else {
      url = url.replace('http://', 'ws://');
    }

    const socket = new WebSocket(url);

    socket.onopen = function () {
      const term = new Terminal();


      term.on('data', function (data) {
        socket.send(data);
      });

      var terminal_container = document.getElementById('terminal-container');
      term.open(terminal_container);
      term.focus();
      term.setOption('cursorBlink', true);

      // window.onresize = function () {
      //   resizefun();
      //   $scope.$apply();
      // };

      // $scope.$watch('toggle', function () {
      //   setTimeout(resizefun, 400);
      // });

      socket.onmessage = function (e) {
        term.write(e.data);
      };

      socket.onerror = function (err) {
        // $scope.disconnect();
        // $scope.$apply();
        this.Notifications.error("Failure", err, "Connection error");
      };

      socket.onclose = function () {
        // $scope.disconnect();
        // $scope.$apply();
      };

      // resizefun(1);
      // $scope.$apply();
    };
  }

  async onInit() {
    this.state = {
      actionInProgress: false,
      availableCommands: ['/bin/bash', '/bin/sh'],
      command: '/bin/sh',
      connected: false
    };

    const podName = this.$transition$.params().pod;
    const applicationName = this.$transition$.params().name;
    const namespace = this.$transition$.params().namespace;

    this.podName = podName;

    try {
      this.application = await this.KubernetesApplicationService.application(namespace, applicationName);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve application logs');
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesApplicationConsoleController;
angular.module('portainer.kubernetes').controller('KubernetesApplicationConsoleController', KubernetesApplicationConsoleController);