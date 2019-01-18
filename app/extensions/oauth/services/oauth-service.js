angular.module('portainer.extensions.oauth').service('OAuthService', [
  'API_ENDPOINT_OAUTH', 'OAuth', 'urlHelper', 'Notifications',
  function OAuthService(API_ENDPOINT_OAUTH, OAuth, urlHelper, Notifications) {
    this.login = login;

    function login() {
      var loginUrl = API_ENDPOINT_OAUTH + '/login';
      var popup = window.open(loginUrl, 'login-popup', 'width=800, height=600');
      if (!popup) {
        Notifications.warn('Please enable popups for this page');
      }
      return waitForCode(popup).then(function onCodeReady(code) {
        return OAuth.validate({ code: code }).$promise;
      });
    }

    function waitForCode(popup) {
      return waitFor(function checkIfCodeIsAvailable() {
        if (popup.document.URL.indexOf('code') !== -1) {
          var queryParams = popup.location.search;
          popup.close();
          return urlHelper.getParameter(queryParams, 'code');
        }
      });
    }

    function waitFor(clbk, interval) {
      interval = interval || 100;
      var intervalId;
      return new Promise(function executor(resolve) {
        intervalId = setInterval(function intervalFunction() {
          var callbackReturn = clbk();
          if (callbackReturn) {
            clearInterval(intervalId);
            resolve(callbackReturn);
          }
        }, interval);
      });
    }
  },
]);
