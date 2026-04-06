import angular from 'angular';
import _ from 'lodash-es';
import i18n from '@/i18n';

angular.module('portainer.app').controller('TagsController', TagsController);

function TagsController($scope, $state, $async, TagService, Notifications) {
  const t = i18n.t.bind(i18n);
  $scope.t = t; // Expose t function to template

  // Page header translations
  $scope.pageTitle = t('tags.title');
  $scope.pageBreadcrumbs = [{ label: t('tags.breadcrumbs') }];

  $scope.state = {
    actionInProgress: false,
  };

  $scope.formValues = {
    Name: '',
  };

  $scope.checkNameValidity = function (form) {
    var valid = true;
    for (var i = 0; i < $scope.tags.length; i++) {
      if ($scope.formValues.Name === $scope.tags[i].Name) {
        valid = false;
        break;
      }
    }
    form.name.$setValidity('validName', valid);
  };

  $scope.removeAction = removeAction;

  function removeAction(tags) {
    return $async(removeActionAsync, tags);
  }

  async function removeActionAsync(tags) {
    for (let tag of tags) {
      try {
        await TagService.deleteTag(tag.Id);

        Notifications.success(t('tags.remove_success'), tag.Name);
        _.remove($scope.tags, tag);
      } catch (err) {
        Notifications.error(t('common.failure'), err, t('tags.remove_error'));
      }
    }

    $state.reload();
  }

  $scope.createTag = function () {
    var tagName = $scope.formValues.Name;
    TagService.createTag(tagName)
      .then(function success() {
        Notifications.success(t('tags.create_success'), tagName);
        $state.reload();
      })
      .catch(function error(err) {
        Notifications.error(t('common.failure'), err, t('tags.create_error'));
      });
  };

  function initView() {
    TagService.tags()
      .then(function success(data) {
        $scope.tags = data;
      })
      .catch(function error(err) {
        Notifications.error(t('common.failure'), err, t('tags.retrieve_error'));
        $scope.tags = [];
      });
  }

  initView();
}
