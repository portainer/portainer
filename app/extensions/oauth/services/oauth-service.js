angular.module('portainer.extensions.oauth').service('OAuthService', [
  'SettingsService', 'OAuth', 'urlHelper',
  function OAuthService(SettingsService, OAuth, urlHelper) {
    this.login = login;

    function login() {
      return getLoginURI()
        .then(function openPopup(loginUrl) {
          var popup = window.open(loginUrl, 'login-popup', 'width=800, height=600');
          if (!popup) {
            throw new Error('Please enable popups for this page');
          }
          return waitForCode(popup);
        })
        .then(function onCodeReady(code) {
          return OAuth.login({ code: code }).$promise;
        });
    }

    function getLoginURI() {
      return SettingsService.publicSettings().then(function onLoadSettings(settings) {
        if (settings.AuthenticationMethod !== 3) {
          throw new Error('OAuth is disabled');
        }
        return settings.OAuthLoginURI;
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
  }
]);
