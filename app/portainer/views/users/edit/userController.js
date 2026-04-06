import { ModalType } from '@@/modals';
import { buildConfirmButton } from '@@/modals/utils';
import { confirm, confirmChangePassword, confirmDelete } from '@@/modals/confirm';
import i18n from '@/i18n';

angular.module('portainer.app').controller('UserController', [
  '$q',
  '$scope',
  '$state',
  '$transition$',
  'UserService',
  'Notifications',
  'SettingsService',
  'Authentication',
  function ($q, $scope, $state, $transition$, UserService, Notifications, SettingsService, Authentication) {
    $scope.state = {
      updatePasswordError: '',
    };

    $scope.formValues = {
      username: '',
      newPassword: '',
      confirmPassword: '',
      Administrator: false,
    };

    $scope.handleAdministratorChange = function (checked) {
      return $scope.$evalAsync(() => {
        $scope.formValues.Administrator = checked;
      });
    };

    $scope.deleteUser = function () {
      confirmDelete(i18n.t('portainer_users.delete_confirm_message')).then((confirmed) => {
        if (!confirmed) {
          return;
        }
        deleteUser();
      });
    };

    $scope.updateUser = async function () {
      const role = $scope.formValues.Administrator ? 1 : 2;
      const oldUsername = $scope.user.Username;
      const username = $scope.formValues.username;

      if (username != oldUsername) {
        const confirmed = await confirm({
          title: i18n.t('portainer_users.rename_confirm_title'),
          modalType: ModalType.Warn,
          message: i18n.t('portainer_users.rename_confirm_message', { oldUsername, username }),
          confirmButton: buildConfirmButton(i18n.t('portainer_users.update_button')),
        });

        if (!confirmed) {
          return;
        }
      }

      UserService.updateUser($scope.user.Id, { role, username })
        .then(function success() {
          Notifications.success(i18n.t('common.success'), i18n.t('portainer_users.user_updated'));
          $state.reload();
        })
        .catch(function error(err) {
          Notifications.error(i18n.t('common.failure'), err, i18n.t('portainer_users.unable_update_permissions'));
        });
    };

    $scope.updatePassword = async function () {
      const isCurrentUser = Authentication.getUserDetails().ID === $scope.user.Id;
      const confirmed = !isCurrentUser || (await confirmChangePassword());
      if (!confirmed) {
        return;
      }
      UserService.updateUser($scope.user.Id, { newPassword: $scope.formValues.newPassword })
        .then(function success() {
          Notifications.success(i18n.t('common.success'), i18n.t('portainer_users.password_updated'));

          if (isCurrentUser) {
            $state.go('portainer.logout');
          } else {
            $state.reload();
          }
        })
        .catch(function error(err) {
          Notifications.error(i18n.t('common.failure'), err, i18n.t('portainer_users.unable_update_password'));
        });
    };

    function deleteUser() {
      UserService.deleteUser($scope.user.Id)
        .then(function success() {
          Notifications.success(i18n.t('portainer_users.user_deleted'), $scope.user.Username);
          $state.go('portainer.users');
        })
        .catch(function error(err) {
          Notifications.error(i18n.t('common.failure'), err, i18n.t('portainer_users.unable_remove_user'));
        });
    }

    $scope.isSubmitEnabled = isSubmitEnabled;
    function isSubmitEnabled() {
      const { user, formValues } = $scope;
      return user && (user.Username !== formValues.username || (formValues.Administrator && user.Role !== 1) || (!formValues.Administrator && user.Role === 1));
    }

    $scope.isDeleteDisabled = isDeleteDisabled;
    function isDeleteDisabled() {
      const { user } = $scope;
      return user && user.Id === 1;
    }

    function initView() {
      $scope.isAdmin = Authentication.isAdmin();

      $q.all({
        user: UserService.user($transition$.params().id),
        settings: SettingsService.publicSettings(),
      })
        .then(function success(data) {
          var user = data.user;
          $scope.user = user;
          $scope.formValues.Administrator = user.Role === 1;
          $scope.formValues.username = user.Username;
          $scope.AuthenticationMethod = data.settings.AuthenticationMethod;
          $scope.requiredPasswordLength = data.settings.RequiredPasswordLength;
        })
        .catch(function error(err) {
          Notifications.error(i18n.t('common.failure'), err, i18n.t('portainer_users.unable_retrieve_user_info'));
        });
    }

    initView();
  },
]);
