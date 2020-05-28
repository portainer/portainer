angular.module('portainer.app').controller('SettingsAuthenticationController', [
  '$q',
  '$scope',
  '$state',
  'Notifications',
  'SettingsService',
  'FileUploadService',
  'TeamService',
  'ExtensionService',
  function ($q, $scope, $state, Notifications, SettingsService, FileUploadService, TeamService, ExtensionService) {
    $scope.state = {
      successfulConnectivityCheck: false,
      failedConnectivityCheck: false,
      uploadInProgress: false,
      connectivityCheckInProgress: false,
      actionInProgress: false,
      availableUserSessionTimeoutOptions: [
        {
          key: 'Use default (8 hours)',
          value: '',
        },
        {
          key: '1 hour',
          value: '1h',
        },
        {
          key: '24 hours',
          value: '24h',
        },
        { key: '2 days', value: '2d' },
        { key: '1 week', value: '1w' },
      ],
    };

    $scope.formValues = {
      UserSessionTimeout: $scope.state.availableUserSessionTimeoutOptions[0],
      TLSCACert: '',
      LDAPSettings: {
        AnonymousMode: true,
        ReaderDN: '',
        URL: '',
        TLSConfig: {
          TLS: false,
          TLSSkipVerify: false,
        },
        StartTLS: false,
        SearchSettings: [
          {
            BaseDN: '',
            Filter: '',
            UserNameAttribute: '',
          },
        ],
        GroupSearchSettings: [
          {
            GroupBaseDN: '',
            GroupFilter: '',
            GroupAttribute: '',
          },
        ],
        AutoCreateUsers: true,
      },
    };

    $scope.goToOAuthExtensionView = function () {
      $state.go('portainer.extensions.extension', { id: 2 });
    };

    $scope.isOauthEnabled = function isOauthEnabled() {
      return $scope.settings && $scope.settings.AuthenticationMethod === 3;
    };

    $scope.addSearchConfiguration = function () {
      $scope.formValues.LDAPSettings.SearchSettings.push({ BaseDN: '', UserNameAttribute: '', Filter: '' });
    };

    $scope.removeSearchConfiguration = function (index) {
      $scope.formValues.LDAPSettings.SearchSettings.splice(index, 1);
    };

    $scope.addGroupSearchConfiguration = function () {
      $scope.formValues.LDAPSettings.GroupSearchSettings.push({ GroupBaseDN: '', GroupAttribute: '', GroupFilter: '' });
    };

    $scope.removeGroupSearchConfiguration = function (index) {
      $scope.formValues.LDAPSettings.GroupSearchSettings.splice(index, 1);
    };

    $scope.LDAPConnectivityCheck = function () {
      var settings = angular.copy($scope.settings);
      var TLSCAFile = $scope.formValues.TLSCACert !== settings.LDAPSettings.TLSConfig.TLSCACert ? $scope.formValues.TLSCACert : null;

      if ($scope.formValues.LDAPSettings.AnonymousMode) {
        settings.LDAPSettings['ReaderDN'] = '';
        settings.LDAPSettings['Password'] = '';
      }

      var uploadRequired = ($scope.formValues.LDAPSettings.TLSConfig.TLS || $scope.formValues.LDAPSettings.StartTLS) && !$scope.formValues.LDAPSettings.TLSConfig.TLSSkipVerify;
      $scope.state.uploadInProgress = uploadRequired;

      $scope.state.connectivityCheckInProgress = true;
      $q.when(!uploadRequired || FileUploadService.uploadLDAPTLSFiles(TLSCAFile, null, null))
        .then(function success() {
          addLDAPDefaultPort(settings, $scope.formValues.LDAPSettings.TLSConfig.TLS);
          return SettingsService.checkLDAPConnectivity(settings);
        })
        .then(function success() {
          $scope.state.failedConnectivityCheck = false;
          $scope.state.successfulConnectivityCheck = true;
          Notifications.success('Connection to LDAP successful');
        })
        .catch(function error(err) {
          $scope.state.failedConnectivityCheck = true;
          $scope.state.successfulConnectivityCheck = false;
          Notifications.error('Failure', err, 'Connection to LDAP failed');
        })
        .finally(function final() {
          $scope.state.uploadInProgress = false;
          $scope.state.connectivityCheckInProgress = false;
        });
    };

    $scope.saveSettings = function () {
      var settings = angular.copy($scope.settings);
      var TLSCAFile = $scope.formValues.TLSCACert !== settings.LDAPSettings.TLSConfig.TLSCACert ? $scope.formValues.TLSCACert : null;

      if ($scope.formValues.LDAPSettings.AnonymousMode) {
        settings.LDAPSettings['ReaderDN'] = '';
        settings.LDAPSettings['Password'] = '';
      }

      var uploadRequired = ($scope.formValues.LDAPSettings.TLSConfig.TLS || $scope.formValues.LDAPSettings.StartTLS) && !$scope.formValues.LDAPSettings.TLSConfig.TLSSkipVerify;
      $scope.state.uploadInProgress = uploadRequired;

      $scope.state.actionInProgress = true;
      $q.when(!uploadRequired || FileUploadService.uploadLDAPTLSFiles(TLSCAFile, null, null))
        .then(function success() {
          addLDAPDefaultPort(settings, $scope.formValues.LDAPSettings.TLSConfig.TLS);
          return SettingsService.update(settings);
        })
        .then(function success() {
          Notifications.success('Authentication settings updated');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to update authentication settings');
        })
        .finally(function final() {
          $scope.state.uploadInProgress = false;
          $scope.state.actionInProgress = false;
        });
    };

    // Add default port if :port is not defined in URL
    function addLDAPDefaultPort(settings, tlsEnabled) {
      if (settings.LDAPSettings.URL.indexOf(':') === -1) {
        settings.LDAPSettings.URL += tlsEnabled ? ':636' : ':389';
      }
    }

    function initView() {
      $q.all({
        settings: SettingsService.settings(),
        teams: TeamService.teams(),
        oauthAuthentication: ExtensionService.extensionEnabled(ExtensionService.EXTENSIONS.OAUTH_AUTHENTICATION),
      })
        .then(function success(data) {
          var settings = data.settings;
          $scope.teams = data.teams;
          $scope.settings = settings;
          $scope.formValues.LDAPSettings = settings.LDAPSettings;
          $scope.OAuthSettings = settings.OAuthSettings;
          $scope.formValues.TLSCACert = settings.LDAPSettings.TLSConfig.TLSCACert;
          $scope.oauthAuthenticationAvailable = data.oauthAuthentication;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve application settings');
        });
    }

    initView();
  },
]);
