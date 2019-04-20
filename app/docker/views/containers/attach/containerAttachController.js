import { Terminal } from 'xterm';

angular.module('portainer.docker')
.controller('ContainerAttachController', ['$scope', '$transition$', 'ContainerService', 'ImageService', 'EndpointProvider', 'Notifications', 'ContainerHelper', 'AttachService', 'HttpRequestHelper', 'LocalStorage',
function ($scope, $transition$, ContainerService, ImageService, EndpointProvider, Notifications, ContainerHelper, AttachService, HttpRequestHelper, LocalStorage) {
  var socket, term;

  $scope.state = {
    loaded: false,
    connected: false,
    connecting: false
  };

  // Ensure the socket is closed before leaving the view
  $scope.$on('$stateChangeStart', function () {
    if (socket && socket !== null) {
      socket.close();
    }
  });

  $scope.connect = function() {
    if ($scope.state.connecting || $scope.state.connected) {
      return;
    }

    $scope.state.connecting = true;

    var termWidth = Math.floor(($('#terminal-container').width() - 20) / 8.39);
    var termHeight = 30;

    var attachId = $transition$.params().id;
    var jwtToken = LocalStorage.getJWT();


    ContainerService.container(attachId).then((details)=> {

      if (!details.State.Running) {
        Notifications.error("Failure", details, "Container is not running!");
        return;
      }

      let params = {
        token: jwtToken,
        endpointId: EndpointProvider.endpointID(),
        id: attachId
      };

      let param_string = Object.keys(params).map((k) => k + "=" + params[k]).join("&");

      var url = window.location.href.split('#')[0] + 'api/websocket/attach?' + param_string;

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
    });
  };

  $scope.disconnect = function() {
    if (socket !== null) {
      socket.close();
    }
  };

  function initTerm(url, height, width) {
    socket = new WebSocket(url);

    socket.onopen = function() {
      $scope.state.connected = true;
      $scope.state.connecting = false;
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
        $scope.state.connected = false;
        $scope.state.connecting = false;
        term.write("\n\r(connection closed)");
        if (term !== null) {
          term.dispose();
        }
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
    .then(function success() {
      $scope.state.loaded = true;
      $scope.connect();
    })
    .catch(function error(err) {
      Notifications.error('Error', err, 'Unable to retrieve container details');
    });
  }

  initView();
}]);
